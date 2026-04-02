const { Resend } = require('resend');
const { logger } = require('./logger');

let resendClient = null;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

function appBaseUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:3005').replace(/\/$/, '');
}

async function sendTransactionalEmail({ to, subject, html, text }) {
  const from = process.env.RESEND_FROM_EMAIL;
  const resend = getResend();
  if (!resend || !from) {
    logger.warn('Resend: RESEND_API_KEY veya RESEND_FROM_EMAIL eksik; e-posta gönderilmedi.');
    return { ok: false, skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });

  if (error) {
    logger.error('Resend gönderim hatası: %s', error.message);
    return { ok: false, error };
  }

  logger.debug('Resend e-posta gönderildi: %s', data?.id);
  return { ok: true, id: data?.id };
}

async function sendPasswordResetEmail({ to, resetToken }) {
  const url = `${appBaseUrl()}/sifre-sifirla?token=${encodeURIComponent(resetToken)}`;
  const subject = 'UpBilet — şifre sıfırlama';
  const text = [
    'Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın (30 dakika geçerlidir):',
    '',
    url,
    '',
    'Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #18181b;">
  <p>Merhaba,</p>
  <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bağlantı <strong>30 dakika</strong> geçerlidir.</p>
  <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#615fff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Şifremi sıfırla</a></p>
  <p style="font-size:14px;color:#71717a;">Buton çalışmıyorsa bu adresi tarayıcıya yapıştırın:<br/><span style="word-break:break-all;">${url.replace(/&/g, '&amp;')}</span></p>
  <p style="font-size:14px;color:#71717a;">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
</body>
</html>`;

  return sendTransactionalEmail({ to, subject, html, text });
}

async function sendWelcomeEmail({ to, name, surname }) {
  const displayName = [name, surname].filter(Boolean).join(' ').trim();
  const salutation = displayName ? `Merhaba ${displayName}` : 'Merhaba';
  const subject = 'UpBilet — kaydınız tamamlandı';
  const text = [
    `${salutation},`,
    '',
    'UpBilet’e başarıyla kaydoldunuz. Hesabınızla etkinliklere göz atabilir, bilet alıp satabilirsiniz.',
    '',
    'Bir sorunuz olursa destek ekibimizle iletişime geçebilirsiniz.',
    '',
    'İyi günler dileriz,',
    'UpBilet',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #18181b;">
  <p>${escapeHtml(salutation)},</p>
  <p><strong>UpBilet’e başarıyla kaydoldunuz.</strong> Hesabınızla etkinliklere göz atabilir, bilet alıp satabilirsiniz.</p>
  <p style="font-size:14px;color:#71717a;">Bir sorunuz olursa destek ekibimizle iletişime geçebilirsiniz.</p>
  <p>İyi günler dileriz,<br/>UpBilet</p>
</body>
</html>`;

  return sendTransactionalEmail({ to, subject, html, text });
}

function formatMoneyTr(amount, currency) {
  const n = Number(amount);
  const cur = String(currency || 'TRY').toUpperCase();
  const formatted = Number.isFinite(n)
    ? n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(amount);
  if (cur === 'TRY' || cur === 'TRL') return `${formatted} TL`;
  return `${formatted} ${cur}`;
}

async function sendPurchaseConfirmationEmail({
  to,
  name,
  surname,
  referenceCode,
  eventName,
  ticketQuantity,
  totalAmount,
  currency,
}) {
  const displayName = [name, surname].filter(Boolean).join(' ').trim();
  const salutation = displayName ? `Merhaba ${displayName}` : 'Merhaba';
  const ref = String(referenceCode || '').trim();
  const subject = ref
    ? `UpBilet — satın alımınız alındı (${ref})`
    : 'UpBilet — satın alımınız alındı';
  const eventLine =
    eventName && String(eventName).trim()
      ? `Etkinlik: ${String(eventName).trim()}`
      : null;
  const qty = Number(ticketQuantity) || 0;
  const totalStr = formatMoneyTr(totalAmount, currency);

  const textParts = [
    `${salutation},`,
    '',
    'Ödemeniz başarıyla alındı. Satın alımınız için teşekkür ederiz.',
    ref ? `Referans kodunuz: ${ref}` : '',
    eventLine || '',
    qty > 0 ? `Bilet adedi: ${qty}` : '',
    `Toplam: ${totalStr}`,
    '',
    ref ? 'Sipariş ve destek süreçlerinde bu referans kodunu kullanabilirsiniz.' : '',
    '',
    'İyi günler dileriz,',
    'UpBilet',
  ].filter(Boolean);

  const text = textParts.join('\n');

  const htmlEvent = eventLine
    ? `<p style="margin:0 0 8px;"><strong>Etkinlik:</strong> ${escapeHtml(String(eventName).trim())}</p>`
    : '';
  const htmlQty =
    qty > 0 ? `<p style="margin:0 0 8px;"><strong>Bilet adedi:</strong> ${qty}</p>` : '';

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #18181b;">
  <p>${escapeHtml(salutation)},</p>
  <p><strong>Ödemeniz başarıyla alındı.</strong> Satın alımınız için teşekkür ederiz.</p>
  ${
    ref
      ? `<p style="margin:16px 0;padding:12px 14px;background:#f4f4f5;border-radius:8px;font-size:15px;"><strong>Referans kodu:</strong> <span style="font-family:ui-monospace,monospace;letter-spacing:0.02em;">${escapeHtml(ref)}</span></p>`
      : ''
  }
  ${htmlEvent}
  ${htmlQty}
  <p style="margin:0 0 8px;"><strong>Toplam:</strong> ${escapeHtml(totalStr)}</p>
  ${
    ref
      ? '<p style="font-size:14px;color:#71717a;">Sipariş ve destek süreçlerinde bu referans kodunu kullanabilirsiniz.</p>'
      : '<p style="font-size:14px;color:#71717a;">Sipariş detaylarını hesabınızdan görüntüleyebilirsiniz.</p>'
  }
  <p>İyi günler dileriz,<br/>UpBilet</p>
</body>
</html>`;

  return sendTransactionalEmail({ to, subject, html, text });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  sendTransactionalEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPurchaseConfirmationEmail,
};
