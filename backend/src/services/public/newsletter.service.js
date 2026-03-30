const NewsletterSubscriber = require('../../models/newsletterSubscriber.model');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw) {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  if (!e || e.length > 320 || !EMAIL_RE.test(e)) return null;
  return e;
}

class PublicNewsletterService {
  async subscribe(rawEmail, rawSource) {
    const email = normalizeEmail(rawEmail);
    if (!email) {
      return {
        status: 400,
        body: { success: false, message: 'Geçerli bir e-posta adresi girin' },
      };
    }

    const source =
      typeof rawSource === 'string' && rawSource.trim().slice(0, 64)
        ? rawSource.trim().slice(0, 64)
        : 'homepage';

    try {
      await NewsletterSubscriber.create({ email, source });
      return {
        status: 201,
        body: { success: true, message: 'Kaydınız alındı' },
      };
    } catch (err) {
      if (err.code === 11000) {
        return {
          status: 200,
          body: {
            success: true,
            message: 'Bu e-posta adresi zaten kayıtlı',
            alreadySubscribed: true,
          },
        };
      }
      throw err;
    }
  }
}

module.exports = new PublicNewsletterService();
