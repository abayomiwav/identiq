import { createInterface } from 'node:readline';

export interface PasswordSources {
  flag?: string;
  env?: NodeJS.ProcessEnv;
  isTTY?: boolean;
  prompt?: () => Promise<string>;
}

/**
 * Resolves the login password without requiring it on the command line,
 * where it would land in shell history and be visible in `ps`. Order:
 * explicit --password flag, then IDENTIQ_PASSWORD, then a hidden prompt
 * when attached to a terminal.
 */
export async function resolvePassword({
  flag,
  env = process.env,
  isTTY = Boolean(process.stdin.isTTY),
  prompt = promptHidden,
}: PasswordSources = {}): Promise<string> {
  if (flag) return flag;
  if (env.IDENTIQ_PASSWORD) return env.IDENTIQ_PASSWORD;
  if (isTTY) return prompt();
  throw new Error('No password provided. Set IDENTIQ_PASSWORD or run `identiq login` in an interactive terminal.');
}

/** Reads a line from stdin without echoing what's typed. */
export function promptHidden(question = 'Password: '): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (s: string) => void };
    process.stdout.write(question);
    output._writeToOutput = () => {};
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}
