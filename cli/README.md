# @identiq/cli

The Identiq developer CLI.

```bash
npm install -g @identiq/cli

identiq login --email you@example.com          # prompts for your password
identiq apps create "Acme Marketplace" --redirect-uri https://acme.example/callback
identiq apps list
identiq apps rotate-key <appId>
identiq whoami
identiq logout
```

In CI or other non-interactive shells, set `IDENTIQ_PASSWORD` instead of
passing `--password`, which would land in shell history and `ps` output.

Credentials are stored in `~/.identiq/config.json` (mode `600`). Override
the API target with `--api-url` on `login`, or `IDENTIQ_CONFIG_DIR` to
point config at a different location entirely (used by the test suite).

```bash
npm run build --workspace @identiq/cli
npm run test --workspace @identiq/cli
```
