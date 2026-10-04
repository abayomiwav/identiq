import { describe, expect, it, vi } from 'vitest';
import { resolvePassword } from './password';

describe('resolvePassword', () => {
  it('prefers an explicit --password flag', async () => {
    await expect(resolvePassword({ flag: 'from-flag', env: { IDENTIQ_PASSWORD: 'from-env' } })).resolves.toBe(
      'from-flag',
    );
  });

  it('falls back to IDENTIQ_PASSWORD', async () => {
    await expect(resolvePassword({ env: { IDENTIQ_PASSWORD: 'from-env' }, isTTY: false })).resolves.toBe('from-env');
  });

  it('prompts when attached to a terminal', async () => {
    const prompt = vi.fn().mockResolvedValue('typed');
    await expect(resolvePassword({ env: {}, isTTY: true, prompt })).resolves.toBe('typed');
    expect(prompt).toHaveBeenCalledOnce();
  });

  it('fails clearly when nothing is available and stdin is not a TTY', async () => {
    await expect(resolvePassword({ env: {}, isTTY: false })).rejects.toThrow(/IDENTIQ_PASSWORD/);
  });
});
