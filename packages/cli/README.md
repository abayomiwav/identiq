# @identiq/cli

The Identiq developer CLI.

```bash
npm install -g @identiq/cli

identiq login --email you@example.com --password ********
identiq apps create "Acme Marketplace" --redirect-uri https://acme.example/callback
identiq apps list
identiq apps rotate-key <appId>
identiq whoami
identiq logout
```

Credentials are stored in `~/.identiq/config.json` (mode `600`). Override
the API target with `--api-url` on `login`, or `IDENTIQ_CONFIG_DIR` to
point config at a different location entirely (used by the test suite).

```bash
npm run build --workspace @identiq/cli
npm run test --workspace @identiq/cli
```
