import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  Networks,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';

export interface SubmittedTransaction {
  hash: string;
  returnValue: unknown;
}

/**
 * All identity-owner actions (register identity, grant/revoke permission) are
 * built here as *unsigned* XDR and returned to the caller — the wallet that
 * owns the Stellar keypair signs client-side and only the signed XDR comes
 * back for submission. This service never sees a user's private key.
 *
 * Platform-issued credentials (the results Identiq's own verification flow
 * produces, e.g. EMAIL_VERIFIED) are signed with the platform's own
 * operational signer, which is Identiq's key, not a user's — the same
 * non-custodial boundary StellarTickets draws around its platform signer.
 */
@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: rpc.Server;
  private readonly networkPassphrase: string;
  private readonly contractId?: string;
  private readonly platformSignerSecret?: string;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('stellar.rpcUrl')!;
    const network = this.configService.get<string>('stellar.network');
    this.server = new rpc.Server(rpcUrl);
    this.networkPassphrase =
      network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
    this.contractId = this.configService.get<string>(
      'stellar.identityContractId',
    );
    this.platformSignerSecret = this.configService.get<string>(
      'stellar.platformSignerSecret',
    );
  }

  private getContract(): Contract {
    if (!this.contractId) {
      throw new Error('IDENTITY_CONTRACT_ID is not configured');
    }
    return new Contract(this.contractId);
  }

  /** Builds an unsigned transaction invoking `method` from `sourcePublicKey`, ready for a wallet to sign. */
  async buildUnsignedTransaction(
    sourcePublicKey: string,
    method: string,
    args: xdr.ScVal[],
  ): Promise<string> {
    const account = await this.server.getAccount(sourcePublicKey);
    const contract = this.getContract();

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(300)
      .build();

    const prepared = await this.server.prepareTransaction(transaction);
    return prepared.toXDR();
  }

  buildRegisterIdentityXdr(ownerPublicKey: string): Promise<string> {
    return this.buildUnsignedTransaction(ownerPublicKey, 'register_identity', [
      new Address(ownerPublicKey).toScVal(),
    ]);
  }

  buildGrantPermissionXdr(
    ownerPublicKey: string,
    identityChainId: bigint,
    appAddress: string,
    credentialType: string,
    ttlSeconds: number,
  ): Promise<string> {
    return this.buildUnsignedTransaction(ownerPublicKey, 'grant_permission', [
      new Address(ownerPublicKey).toScVal(),
      nativeToScVal(identityChainId, { type: 'u64' }),
      new Address(appAddress).toScVal(),
      nativeToScVal(credentialType, { type: 'symbol' }),
      nativeToScVal(ttlSeconds, { type: 'u64' }),
    ]);
  }

  buildRevokePermissionXdr(
    ownerPublicKey: string,
    grantChainId: bigint,
  ): Promise<string> {
    return this.buildUnsignedTransaction(ownerPublicKey, 'revoke_permission', [
      new Address(ownerPublicKey).toScVal(),
      nativeToScVal(grantChainId, { type: 'u64' }),
    ]);
  }

  buildRevokeCredentialXdr(
    revokerPublicKey: string,
    credentialChainId: bigint,
  ): Promise<string> {
    return this.buildUnsignedTransaction(
      revokerPublicKey,
      'revoke_credential',
      [
        new Address(revokerPublicKey).toScVal(),
        nativeToScVal(credentialChainId, { type: 'u64' }),
      ],
    );
  }

  /** Submits a transaction a wallet has already signed. This service never holds the signing key. */
  async submitSignedTransaction(
    signedXdr: string,
  ): Promise<SubmittedTransaction> {
    const transaction = TransactionBuilder.fromXDR(
      signedXdr,
      this.networkPassphrase,
    );
    const sendResponse = await this.server.sendTransaction(transaction);

    if (sendResponse.status === 'ERROR') {
      throw new Error(
        `Transaction submission failed: ${sendResponse.errorResult?.toXDR('base64')}`,
      );
    }

    const result = await this.pollTransaction(sendResponse.hash);
    return result;
  }

  private async pollTransaction(
    hash: string,
    attempt = 0,
  ): Promise<SubmittedTransaction> {
    if (attempt >= 15) {
      throw new Error(`Timed out waiting for transaction ${hash} to settle`);
    }

    const response = await this.server.getTransaction(hash);

    if (response.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return {
        hash,
        returnValue: response.returnValue
          ? scValToNative(response.returnValue)
          : undefined,
      };
    }

    if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction ${hash} failed on-chain`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.pollTransaction(hash, attempt + 1);
  }

  /** Platform-signed: Identiq attests to the result of its own verification flow. */
  async issueCredentialOnChain(
    identityChainId: bigint,
    credentialType: string,
    evidenceHash: Buffer,
    ttlSeconds: number,
  ): Promise<bigint> {
    const platformKeypair = this.getPlatformKeypair();
    const args = [
      new Address(platformKeypair.publicKey()).toScVal(),
      nativeToScVal(identityChainId, { type: 'u64' }),
      nativeToScVal(credentialType, { type: 'symbol' }),
      nativeToScVal(evidenceHash, { type: 'bytes' }),
      nativeToScVal(ttlSeconds, { type: 'u64' }),
    ];

    const result = await this.signAndSubmitAsPlatform(
      'issue_credential',
      args,
      platformKeypair,
    );
    return BigInt(result.returnValue as string | number | bigint);
  }

  async revokeCredentialOnChainAsPlatform(
    credentialChainId: bigint,
  ): Promise<void> {
    const platformKeypair = this.getPlatformKeypair();
    await this.signAndSubmitAsPlatform(
      'revoke_credential',
      [
        new Address(platformKeypair.publicKey()).toScVal(),
        nativeToScVal(credentialChainId, { type: 'u64' }),
      ],
      platformKeypair,
    );
  }

  private getPlatformKeypair(): Keypair {
    if (!this.platformSignerSecret) {
      throw new Error('PLATFORM_SIGNER_SECRET is not configured');
    }
    return Keypair.fromSecret(this.platformSignerSecret);
  }

  private async signAndSubmitAsPlatform(
    method: string,
    args: xdr.ScVal[],
    signer: Keypair,
  ): Promise<SubmittedTransaction> {
    const account = await this.server.getAccount(signer.publicKey());
    const contract = this.getContract();

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(300)
      .build();

    const prepared = await this.server.prepareTransaction(transaction);
    prepared.sign(signer);

    this.logger.log(`Submitting platform-signed ${method} transaction`);
    return this.submitSignedTransaction(prepared.toXDR());
  }
}
