import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CredentialType } from '@identiq/shared';
import { GrantPermissionDto, MAX_GRANT_TTL_DAYS } from './grant-permission.dto';

async function ttlErrors(ttlDays: number) {
  const dto = plainToInstance(GrantPermissionDto, {
    appId: '3f1c2a9e-8b7d-4c6e-9a1b-2c3d4e5f6a7b',
    credentialType: CredentialType.KYC_TIER1,
    ttlDays,
  });
  return (await validate(dto)).filter((e) => e.property === 'ttlDays');
}

describe('GrantPermissionDto ttlDays', () => {
  it('accepts the maximum', async () => {
    expect(await ttlErrors(MAX_GRANT_TTL_DAYS)).toHaveLength(0);
  });

  it('rejects values above a year, including overflow-sized ones', async () => {
    expect(await ttlErrors(MAX_GRANT_TTL_DAYS + 1)).not.toHaveLength(0);
    expect(await ttlErrors(1e9)).not.toHaveLength(0);
  });

  it('rejects zero', async () => {
    expect(await ttlErrors(0)).not.toHaveLength(0);
  });
});
