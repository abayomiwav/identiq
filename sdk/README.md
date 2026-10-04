# @identiq/sdk

Server-side TypeScript SDK for apps integrating with Identiq.

```bash
npm install @identiq/sdk
```

```ts
import { IdentiqClient, buildAuthorizeUrl, parseWebhookPayload, verifyWebhookSignature } from "@identiq/sdk";

const identiq = new IdentiqClient({ apiKey: process.env.IDENTIQ_API_KEY! });

// Send a user here to grant your app permission:
const url = buildAuthorizeUrl({
  appId: process.env.IDENTIQ_APP_ID!,
  redirectUri: "https://yourapp.com/callback",
  credentialTypes: ["KYC_TIER1"],
});

// After they approve, check what they've granted:
const result = await identiq.checkAccess({
  identityId: user.identiqIdentityId,
  credentialType: "KYC_TIER1",
});
// result.verified — pass/fail only, never the underlying document

// Verifying an incoming webhook — signature first, then freshness:
if (!verifyWebhookSignature(webhookSecret, rawBody, req.headers["x-identiq-signature"])) {
  throw new Error("bad signature");
}
const event = parseWebhookPayload(rawBody); // throws if older than 5 minutes (toleranceSeconds)
// Also skip events whose event.id you've already processed — retries reuse the id.
```

Keep your API key server-side — never ship it to a browser.

```bash
npm run build --workspace @identiq/sdk
npm run test --workspace @identiq/sdk
```
