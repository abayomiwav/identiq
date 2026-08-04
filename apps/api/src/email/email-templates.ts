export interface RenderedEmail {
  subject: string;
  html: string;
}

function layout(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Identiq</title>
  </head>
  <body style="margin:0;padding:0;background:#060810;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#060810;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060810;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0b0f1a;border:1px solid rgba(148,163,184,0.14);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px auto;">
                  <tr>
                    <td style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#14b8a6);"></td>
                    <td style="padding-left:10px;font-size:18px;font-weight:600;color:#f1f5f9;">Identiq</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;color:#e2e8f0;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid rgba(148,163,184,0.14);text-align:center;">
                <p style="margin:0;font-size:12px;color:#64748b;">Identiq &middot; Verify Once. Access Everywhere.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#14b8a6);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>`;
}

export function renderCredentialIssuedEmail(params: {
  credentialType: string;
  expiresAt: string | null;
  dashboardUrl: string;
}): RenderedEmail {
  const expiryLine = params.expiresAt
    ? `<p style="margin:12px 0 0 0;color:#94a3b8;">Valid until ${new Date(params.expiresAt).toLocaleDateString()}.</p>`
    : `<p style="margin:12px 0 0 0;color:#94a3b8;">This credential does not expire.</p>`;

  return {
    subject: `Your ${params.credentialType} credential is ready`,
    html: layout(
      `Your ${params.credentialType} credential was issued`,
      `<h1 style="margin:0 0 12px 0;font-size:20px;color:#f8fafc;">Credential issued</h1>
       <p style="margin:0;">A new <strong>${params.credentialType}</strong> credential has been anchored to your identity. Identiq stored only a hash of the evidence checked — never the evidence itself.</p>
       ${expiryLine}
       ${button(params.dashboardUrl, 'View in dashboard')}`,
    ),
  };
}

export function renderCredentialRevokedEmail(params: {
  credentialType: string;
  dashboardUrl: string;
}): RenderedEmail {
  return {
    subject: `Your ${params.credentialType} credential was revoked`,
    html: layout(
      `Your ${params.credentialType} credential was revoked`,
      `<h1 style="margin:0 0 12px 0;font-size:20px;color:#f8fafc;">Credential revoked</h1>
       <p style="margin:0;">Your <strong>${params.credentialType}</strong> credential is no longer active. Any app checking it will now see it as invalid.</p>
       ${button(params.dashboardUrl, 'View in dashboard')}`,
    ),
  };
}

export function renderPermissionGrantedEmail(params: {
  appName: string;
  credentialType: string;
  dashboardUrl: string;
}): RenderedEmail {
  return {
    subject: `You granted ${params.appName} access to your ${params.credentialType} credential`,
    html: layout(
      `You granted ${params.appName} access`,
      `<h1 style="margin:0 0 12px 0;font-size:20px;color:#f8fafc;">Permission granted</h1>
       <p style="margin:0;"><strong>${params.appName}</strong> can now check your <strong>${params.credentialType}</strong> credential's status. They receive a pass/fail result only — never the underlying documents.</p>
       <p style="margin:12px 0 0 0;color:#94a3b8;">You can revoke this at any time from your dashboard.</p>
       ${button(params.dashboardUrl, 'Manage permissions')}`,
    ),
  };
}

export function renderPermissionRevokedEmail(params: {
  appName: string;
  credentialType: string;
  dashboardUrl: string;
}): RenderedEmail {
  return {
    subject: `You revoked ${params.appName}'s access`,
    html: layout(
      `You revoked ${params.appName}'s access`,
      `<h1 style="margin:0 0 12px 0;font-size:20px;color:#f8fafc;">Permission revoked</h1>
       <p style="margin:0;"><strong>${params.appName}</strong> can no longer check your <strong>${params.credentialType}</strong> credential.</p>
       ${button(params.dashboardUrl, 'Manage permissions')}`,
    ),
  };
}
