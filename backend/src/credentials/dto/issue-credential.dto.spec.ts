import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CredentialType } from '@identiq/shared';
import {
  IssueCredentialDto,
  MAX_CREDENTIAL_TTL_DAYS,
} from './issue-credential.dto';

async function ttlErrors(ttlDays: number) {
  const dto = plainToInstance(IssueCredentialDto, {
    type: CredentialType.KYC_TIER1,
    evidence: 'doc-ref-123',
    ttlDays,
  });
  return (await validate(dto)).filter((e) => e.property === 'ttlDays');
}

describe('IssueCredentialDto ttlDays', () => {
  it('accepts the maximum', async () => {
    expect(await ttlErrors(MAX_CREDENTIAL_TTL_DAYS)).toHaveLength(0);
  });

  it('rejects values that would overflow expiresAt', async () => {
    expect(await ttlErrors(MAX_CREDENTIAL_TTL_DAYS + 1)).not.toHaveLength(0);
    expect(await ttlErrors(1e9)).not.toHaveLength(0);
  });

  it('rejects zero', async () => {
    expect(await ttlErrors(0)).not.toHaveLength(0);
  });
});
