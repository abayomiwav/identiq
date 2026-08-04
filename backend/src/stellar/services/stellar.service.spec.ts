import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  Account,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { StellarService } from './stellar.service';

const mockServer = {
  getAccount: jest.fn(),
  prepareTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  getTransaction: jest.fn(),
};

jest.mock('@stellar/stellar-sdk', () => {
  const actual = jest.requireActual('@stellar/stellar-sdk');
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: jest.fn(() => mockServer),
    },
  };
});

describe('StellarService', () => {
  const platformKeypair = Keypair.random();
  const contractId = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

  const defaultConfig: Record<string, string> = {
    'stellar.rpcUrl': 'https://soroban-testnet.stellar.org',
    'stellar.network': 'testnet',
    'stellar.identityContractId': contractId,
    'stellar.platformSignerSecret': platformKeypair.secret(),
  };

  async function buildService(
    overrides: Record<string, string | undefined> = {},
  ): Promise<StellarService> {
    const configValues = { ...defaultConfig, ...overrides };
    const moduleRef = await Test.createTestingModule({
      providers: [
        StellarService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => configValues[key] },
        },
      ],
    }).compile();

    return moduleRef.get(StellarService);
  }

  let service: StellarService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await buildService();
  });

  it('builds unsigned XDR for registering an identity, ready for a wallet to sign', async () => {
    const owner = Keypair.random();
    const account = new Account(owner.publicKey(), '100');
    mockServer.getAccount.mockResolvedValue(account);
    mockServer.prepareTransaction.mockImplementation(async (tx: unknown) => tx);

    const xdrString = await service.buildRegisterIdentityXdr(owner.publicKey());

    expect(typeof xdrString).toBe('string');
    expect(xdrString.length).toBeGreaterThan(0);
    expect(mockServer.getAccount).toHaveBeenCalledWith(owner.publicKey());
    expect(mockServer.prepareTransaction).toHaveBeenCalled();
  });

  it('throws a clear error when the identity contract id is not configured', async () => {
    const unconfiguredService = await buildService({
      'stellar.identityContractId': undefined,
    });
    const owner = Keypair.random();
    mockServer.getAccount.mockResolvedValue(
      new Account(owner.publicKey(), '1'),
    );

    await expect(
      unconfiguredService.buildRegisterIdentityXdr(owner.publicKey()),
    ).rejects.toThrow('IDENTITY_CONTRACT_ID is not configured');
  });

  it('throws when submitting a transaction the network rejects outright', async () => {
    const source = Keypair.random();
    const account = new Account(source.publicKey(), '1');
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.bumpSequence({ bumpTo: '2' }))
      .setTimeout(300)
      .build();
    transaction.sign(source);

    mockServer.sendTransaction.mockResolvedValue({
      status: 'ERROR',
      errorResult: { toXDR: () => 'base64-error' },
    });

    await expect(
      service.submitSignedTransaction(transaction.toXDR()),
    ).rejects.toThrow('Transaction submission failed');
  });

  it('throws when the platform signer secret is not configured for an issuer-signed action', async () => {
    const noSignerService = await buildService({
      'stellar.platformSignerSecret': undefined,
    });

    await expect(
      noSignerService.issueCredentialOnChain(
        1n,
        'KYC_TIER1',
        Buffer.from('hash'),
        1000,
      ),
    ).rejects.toThrow('PLATFORM_SIGNER_SECRET is not configured');
  });
});
