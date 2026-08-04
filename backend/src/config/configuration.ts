export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  stellar: {
    network: process.env.STELLAR_NETWORK ?? 'testnet',
    rpcUrl:
      process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
    identityContractId: process.env.IDENTITY_CONTRACT_ID,
    platformSignerSecret: process.env.PLATFORM_SIGNER_SECRET,
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  webUrl: process.env.WEB_URL ?? 'http://localhost:3001',
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : undefined,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
});
