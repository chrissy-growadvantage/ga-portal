/**
 * Internal notification helpers — email (Resend) and Slack (webhook).
 * Both are best-effort: failures are logged but never surface to clients.
 */

type RequestNotificationPayload = {
  operatorEmail: string;
  operatorName: string;
  clientName: string;
  requestTitle: string;
  requestDescription: string | null;
  requestId: string;
  siteUrl: string;
};

/**
 * Send an email to the operator notifying them of a new client request.
 * No-ops if RESEND_API_KEY is not configured.
 */
export async function notifyOperatorByEmail(payload: RequestNotificationPayload): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.log('[notify] RESEND_API_KEY not set — skipping email notification');
    return;
  }

  const requestsUrl = `${payload.siteUrl}/requests`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px">New request from ${escapeHtml(payload.clientName)}</h2>
      <p style="margin:0 0 16px;color:#555">
        A client has submitted a new scope request.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:120px">Title</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(payload.requestTitle)}</td>
        </tr>
        ${payload.requestDescription ? `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Description</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(payload.requestDescription)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Client</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(payload.clientName)}</td>
        </tr>
      </table>
      <a href="${requestsUrl}" style="display:inline-block;padding:10px 20px;background:#5B4DC7;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">
        View in Luma
      </a>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Luma <notifications@lumaops.com>',
        to: [payload.operatorEmail],
        subject: `New request: ${payload.requestTitle} — ${payload.clientName}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[notify] Resend email failed (${res.status}): ${errText}`);
    } else {
      console.log(`[notify] Email sent to ${payload.operatorEmail}`);
    }
  } catch (err) {
    console.error('[notify] Email send threw:', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Post a Slack message to the operator's ops channel.
 * Reads SLACK_WEBHOOK_URL from env — no-ops if not configured.
 */
export async function notifyOperatorBySlack(payload: RequestNotificationPayload): Promise<void> {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!webhookUrl) {
    console.log('[notify] SLACK_WEBHOOK_URL not set — skipping Slack notification');
    return;
  }

  const requestsUrl = `${payload.siteUrl}/requests`;
  const text = [
    `*New request from ${payload.clientName}*`,
    `*Title:* ${payload.requestTitle}`,
    payload.requestDescription ? `*Description:* ${payload.requestDescription}` : null,
    `<${requestsUrl}|View in Luma>`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[notify] Slack webhook failed (${res.status}): ${errText}`);
    } else {
      console.log('[notify] Slack notification sent');
    }
  } catch (err) {
    console.error('[notify] Slack send threw:', err instanceof Error ? err.message : String(err));
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
