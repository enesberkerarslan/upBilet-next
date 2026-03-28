require('dotenv').config();
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const resend = new Resend(process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY);
// HTML template okuma ve placeholder değiştirme fonksiyonu
const loadTemplate = (templateName, placeholders = {}) => {
  try {
    const templatePath = path.join(__dirname, '../public', `${templateName}.html`);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Placeholder'ları değiştir
    Object.keys(placeholders).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, placeholders[key]);
    });
    
    return htmlContent;
  } catch (error) {
    console.error('Template yüklenemedi:', error);
    return null;
  }
};

// HTML Email Gönderme Fonksiyonu
const sendHtmlEmail = async (to, subject, htmlContent, textContent = null) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'info@upbilet.com',
      to: [to],
      subject: subject,
      html: htmlContent,
      text: textContent || 'Bu email HTML formatında gönderilmiştir.',
      // Spam önleme header'ları
      headers: {
        'List-Unsubscribe': '<mailto:unsubscribe@upbilet.com>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'UpBilet Mail System',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'X-Report-Abuse': 'Please report abuse here: abuse@upbilet.com',
        'X-Auto-Response-Suppress': 'OOF, AutoReply'
      },
      // Spam önleme ayarları
      tags: [
        { name: 'category', value: 'transactional' },
        { name: 'source', value: 'upbilet' }
      ]
    });

    if (error) {
      console.error('❌ Resend email gönderilemedi:', error);
      return { success: false, error };
    }

    console.log('✅ Resend email başarıyla gönderildi:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Resend email gönderilemedi:', error);
    return { success: false, error };
  }
};

// Welcome Email Template
const sendWelcomeEmail = async (userEmail, userName) => {
  const htmlContent = loadTemplate('email-welcome', {
    userName: userName || 'Değerli Üyemiz',
    userEmail: userEmail
  });
  
  if (!htmlContent) {
    // Template yüklenemezse basit HTML gönder
    const fallbackHtml = `
      <div lang="tr">
        <h2>Hesabınız Oluşturuldu, ${userName || 'Değerli Üyemiz'}!</h2>
        <p>UpBilet'e hoş geldiniz. Hesabınız başarıyla oluşturuldu.</p>
        <p>Keyifli alışverişler dileriz!</p>
      </div>
    `;
    
    return await sendHtmlEmail(
      userEmail,
      'UpBilet Hesabınız Oluşturuldu!',
      fallbackHtml
    );
  }
  
  return await sendHtmlEmail(
    userEmail,
    'UpBilet Hesabınız Oluşturuldu!',
    htmlContent
  );
};

// Basit Welcome Email Template
const sendSimpleWelcomeEmail = async (userEmail, userName) => {
  const htmlContent = loadTemplate('email-welcome-simple', {
    userName: userName || 'Değerli Üyemiz',
    userEmail: userEmail
  });
  
  if (!htmlContent) {
    // Template yüklenemezse basit HTML gönder
    const fallbackHtml = `
      <div lang="tr">
        <h2>Hoş Geldiniz ${userName || 'Değerli Üyemiz'}!</h2>
        <p>UpBilet ailesine katıldığınız için teşekkür ederiz.</p>
        <p>Artık bilet alım satım platformumuzun tüm özelliklerinden yararlanabilirsiniz.</p>
        <p>Keyifli alışverişler dileriz!</p>
      </div>
    `;
    
    return await sendHtmlEmail(
      userEmail,
      'UpBilet\'e Hoş Geldiniz!',
      fallbackHtml
    );
  }
  
  return await sendHtmlEmail(
    userEmail,
    'UpBilet\'e Hoş Geldiniz!',
    htmlContent
  );
};

// Test Email
const sendTestEmail = async () => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>Test Email</title>
    </head>
    <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #7950F2;">🧪 Test Email</h1>
        <p>Bu bir Resend test email'idir.</p>
        <p>HTML formatında gönderilmiştir.</p>
    </body>
    </html>
  `;

  return await sendHtmlEmail(
    'enes.berk.erarslan@gmail.com',
    'Resend Test Email',
    htmlContent
  );
};

// Sipariş Oluşturuldu Email
const sendOrderCreatedEmail = async (userEmail, userName, orderDetails) => {
  const htmlContent = loadTemplate('email-order-created', {
    userName: userName || 'Değerli Üyemiz',
    orderNumber: orderDetails.orderNumber || 'N/A',
    eventName: orderDetails.eventName || 'N/A',
    eventDate: orderDetails.eventDate || 'N/A',
    eventLocation: orderDetails.eventLocation || 'N/A',
    ticketQuantity: orderDetails.ticketQuantity || 'N/A',
    totalAmount: orderDetails.totalAmount || 'N/A',
    orderDate: orderDetails.orderDate || new Date().toLocaleDateString('tr-TR')
  });
  
  if (!htmlContent) {
    // Template yüklenemezse basit HTML gönder
    const fallbackHtml = `
      <div lang="tr">
        <h2>Siparişiniz Oluşturuldu, ${userName || 'Değerli Üyemiz'}!</h2>
        <p>Sipariş numaranız: ${orderDetails.orderNumber || 'N/A'}</p>
        <p>Etkinlik: ${orderDetails.eventName || 'N/A'}</p>
        <p>Tarih: ${orderDetails.eventDate || 'N/A'}</p>
        <p>Konum: ${orderDetails.eventLocation || 'N/A'}</p>
        <p>Bilet Adedi: ${orderDetails.ticketQuantity || 'N/A'}</p>
        <p>Toplam Tutar: ${orderDetails.totalAmount || 'N/A'}</p>
        <p>Sipariş Tarihi: ${orderDetails.orderDate || new Date().toLocaleDateString('tr-TR')}</p>
        <p>Siparişiniz başarıyla oluşturuldu. Onay için bekleniyor.</p>
      </div>
    `;
    
    return await sendHtmlEmail(
      userEmail,
      'Siparişiniz Oluşturuldu - UpBilet',
      fallbackHtml
    );
  }
  
  return await sendHtmlEmail(
    userEmail,
    'Siparişiniz Oluşturuldu - UpBilet',
    htmlContent
  );
};

// Sipariş Onaylandı Email
const sendOrderConfirmedEmail = async (userEmail, userName, orderDetails) => {
  const htmlContent = loadTemplate('email-order-confirmed', {
    userName: userName || 'Değerli Üyemiz',
    orderNumber: orderDetails.orderNumber || 'N/A',
    eventName: orderDetails.eventName || 'N/A',
    eventDate: orderDetails.eventDate || 'N/A',
    eventLocation: orderDetails.eventLocation || 'N/A',
    ticketQuantity: orderDetails.ticketQuantity || 'N/A',
    totalAmount: orderDetails.totalAmount || 'N/A',
    confirmationDate: orderDetails.confirmationDate || new Date().toLocaleDateString('tr-TR')
  });
  
  if (!htmlContent) {
    // Template yüklenemezse basit HTML gönder
    const fallbackHtml = `
      <div lang="tr">
        <h2>Siparişiniz Onaylandı, ${userName || 'Değerli Üyemiz'}!</h2>
        <p>Sipariş numaranız: ${orderDetails.orderNumber || 'N/A'}</p>
        <p>Etkinlik: ${orderDetails.eventName || 'N/A'}</p>
        <p>Tarih: ${orderDetails.eventDate || 'N/A'}</p>
        <p>Konum: ${orderDetails.eventLocation || 'N/A'}</p>
        <p>Bilet Adedi: ${orderDetails.ticketQuantity || 'N/A'}</p>
        <p>Toplam Tutar: ${orderDetails.totalAmount || 'N/A'}</p>
        <p>Onay Tarihi: ${orderDetails.confirmationDate || new Date().toLocaleDateString('tr-TR')}</p>
        <p>Siparişiniz onaylandı. Biletleriniz hazırlanıyor.</p>
      </div>
    `;
    
    return await sendHtmlEmail(
      userEmail,
      'Siparişiniz Onaylandı - UpBilet',
      fallbackHtml
    );
  }
  
  return await sendHtmlEmail(
    userEmail,
    'Siparişiniz Onaylandı - UpBilet',
    htmlContent
  );
};

// Sipariş Teslim Edildi Email
const sendOrderDeliveredEmail = async (userEmail, userName, orderDetails) => {
  const htmlContent = loadTemplate('email-order-delivered', {
    userName: userName || 'Değerli Üyemiz',
    orderNumber: orderDetails.orderNumber || 'N/A',
    eventName: orderDetails.eventName || 'N/A',
    eventDate: orderDetails.eventDate || 'N/A',
    eventLocation: orderDetails.eventLocation || 'N/A',
    ticketQuantity: orderDetails.ticketQuantity || 'N/A',
    totalAmount: orderDetails.totalAmount || 'N/A',
    deliveryDate: orderDetails.deliveryDate || new Date().toLocaleDateString('tr-TR'),
    deliveryMethod: orderDetails.deliveryMethod || 'Dijital Teslimat'
  });
  
  if (!htmlContent) {
    // Template yüklenemezse basit HTML gönder
    const fallbackHtml = `
      <div lang="tr">
        <h2>Siparişiniz Teslim Edildi, ${userName || 'Değerli Üyemiz'}!</h2>
        <p>Sipariş numaranız: ${orderDetails.orderNumber || 'N/A'}</p>
        <p>Etkinlik: ${orderDetails.eventName || 'N/A'}</p>
        <p>Tarih: ${orderDetails.eventDate || 'N/A'}</p>
        <p>Konum: ${orderDetails.eventLocation || 'N/A'}</p>
        <p>Bilet Adedi: ${orderDetails.ticketQuantity || 'N/A'}</p>
        <p>Toplam Tutar: ${orderDetails.totalAmount || 'N/A'}</p>
        <p>Teslim Tarihi: ${orderDetails.deliveryDate || new Date().toLocaleDateString('tr-TR')}</p>
        <p>Teslim Yöntemi: ${orderDetails.deliveryMethod || 'Dijital Teslimat'}</p>
        <p>Biletleriniz başarıyla teslim edildi. İyi eğlenceler!</p>
      </div>
    `;
    
    return await sendHtmlEmail(
      userEmail,
      'Siparişiniz Teslim Edildi - UpBilet',
      fallbackHtml
    );
  }
  
  return await sendHtmlEmail(
    userEmail,
    'Siparişiniz Teslim Edildi - UpBilet',
    htmlContent
  );
};

module.exports = {
  sendHtmlEmail,
  sendWelcomeEmail,
  sendSimpleWelcomeEmail,
  sendTestEmail,
  sendOrderCreatedEmail,
  sendOrderConfirmedEmail,
  sendOrderDeliveredEmail
};
