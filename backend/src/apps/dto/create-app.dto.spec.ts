import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAppDto } from './create-app.dto';

describe('CreateAppDto webhookUrl', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  async function errorsFor(webhookUrl: string) {
    const dto = plainToInstance(CreateAppDto, {
      name: 'Acme',
      redirectUris: ['https://acme.example/callback'],
      webhookUrl,
    });
    return (await validate(dto)).filter((e) => e.property === 'webhookUrl');
  }

  it('rejects the cloud metadata endpoint in production', async () => {
    process.env.NODE_ENV = 'production';
    expect(
      await errorsFor('http://169.254.169.254/latest/meta-data/'),
    ).not.toHaveLength(0);
  });

  it('accepts a public https URL in production', async () => {
    process.env.NODE_ENV = 'production';
    expect(await errorsFor('https://api.acme.example/hooks')).toHaveLength(0);
  });

  it('allows a localhost receiver in development', async () => {
    process.env.NODE_ENV = 'development';
    expect(await errorsFor('http://localhost:4000/hooks')).toHaveLength(0);
  });
});
