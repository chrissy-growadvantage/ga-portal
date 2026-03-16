type DigestDelivery = {
  title: string;
  category: string;
  completedAt: string;
};

type DigestApproval = {
  title: string;
  category: string;
};

type DigestEmailData = {
  clientName: string;
  operatorName: string;
  deliveriesThisWeek: DigestDelivery[];
  pendingApprovals: DigestApproval[];
  scopeUsed: number;
  scopeTotal: number;
  portalUrl: string;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function buildScopeBar(used: number, total: number): string {
  if (total <= 0) return '';
  const pct = Math.min(Math.round((used / total) * 100), 100);
  const color = pct >= 100 ? '#ef4444' : pct >= 85 ? '#f59e0b' : '#25A576';
  return `
    <tr><td style="padding:24px 32px 16px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1a1a2e;">Scope Usage</p>
      <div style="background:#e5e7eb;border-radius:8px;height:12px;overflow:hidden;">
        <div style="background:${color};height:100%;width:${pct}%;border-radius:8px;"></div>
      </div>
      <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${used} of ${total} used (${pct}%)</p>
    </td></tr>`;
}

export function buildDigestEmail(data: DigestEmailData): string {
  const {
    clientName,
    operatorName,
    deliveriesThisWeek,
    pendingApprovals,
    scopeUsed,
    scopeTotal,
    portalUrl,
  } = data;

  const deliveryRows = deliveriesThisWeek.length > 0
    ? deliveriesThisWeek
        .map(
          (d) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:14px;color:#1a1a2e;">${escapeHtml(d.title)}</span>
          <br/><span style="font-size:12px;color:#6b7280;">${escapeHtml(d.category)} &middot; ${formatDate(d.completedAt)}</span>
        </td>
      </tr>`)
        .join('')
    : `<tr><td style="padding:12px 0;font-size:14px;color:#9ca3af;">No deliveries this week.</td></tr>`;

  const approvalRows = pendingApprovals.length > 0
    ? pendingApprovals
        .map(
          (a) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:14px;color:#1a1a2e;">${escapeHtml(a.title)}</span>
          <br/><span style="font-size:12px;color:#6b7280;">${escapeHtml(a.category)}</span>
        </td>
      </tr>`)
        .join('')
    : '';

  const approvalSection = pendingApprovals.length > 0
    ? `<tr><td style="padding:24px 32px 8px;">
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a2e;">Awaiting Your Approval</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${approvalRows}</table>
      </td></tr>`
    : '';

  const scopeSection = scopeTotal > 0 ? buildScopeBar(scopeUsed, scopeTotal) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Weekly Summary</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#5B4DC7;padding:28px 32px;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Luma</p>
        <p style="margin:6px 0 0;font-size:15px;color:#d4d0f0;">Weekly Summary for ${escapeHtml(clientName)}</p>
      </td></tr>

      <!-- Greeting -->
      <tr><td style="padding:24px 32px 8px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Here's what ${escapeHtml(operatorName)} delivered this week.</p>
      </td></tr>

      <!-- Deliveries -->
      <tr><td style="padding:16px 32px 8px;">
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a2e;">Completed This Week</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${deliveryRows}</table>
      </td></tr>

      ${approvalSection}

      ${scopeSection}

      <!-- CTA -->
      <tr><td style="padding:28px 32px;" align="center">
        <a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#5B4DC7;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;">View Your Portal &rarr;</a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Sent by Luma on behalf of ${escapeHtml(operatorName)}</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
