const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: 'info@upbilet.com',
    pass: process.env.EMAIL_PASSWORD, // Google'dan alınan uygulama şifresi
  },
});

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

// E-posta gönderme fonksiyonu
const sendMail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Posta başarıyla gönderildi:', info.response);
    return { success: true, info };
  } catch (error) {
    console.error('Mail gönderilemedi:', error);
    return { success: false, error };
  }
};

// Test maili gönderme örneği
const sendTestMail = async () => {
  const mailOptions = {
    from: '"UpBilet" <info@upbilet.com>',
    to: 'enes.berk.erarslan@gmail.com',
    subject: 'Test Maili',
    text: 'Merhaba, bu bir test mailidir.',
  };
  
  return await sendMail(mailOptions);
};

// Hoş geldin maili - HTML template ile
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
    
    const mailOptions = {
      from: '"UpBilet" <info@upbilet.com>',
      to: userEmail,
      subject: 'UpBilet Hesabınız Oluşturuldu!',
      html: fallbackHtml,
    };
    
    return await sendMail(mailOptions);
  }
  
  const mailOptions = {
    from: '"UpBilet" <info@upbilet.com>',
    to: userEmail,
    subject: 'UpBilet Hesabınız Oluşturuldu!',
    html: htmlContent,
  };
  
  return await sendMail(mailOptions);
};

// Bilet onay maili - HTML template ile
const sendTicketConfirmationEmail = async (userEmail, ticketDetails) => {
  const htmlContent = loadTemplate('email-ticket-confirmation', {
    name: ticketDetails.name || 'Değerli Müşterimiz',
    eventName: ticketDetails.eventName,
    eventDate: ticketDetails.eventDate,
    eventTime: ticketDetails.eventTime,
    venue: ticketDetails.venue,
    seatInfo: ticketDetails.seatInfo,
    price: ticketDetails.price,
    orderNumber: ticketDetails.orderNumber
  });
  
  if (!htmlContent) {
    // Template yüklenemezse basit HTML gönder
    const fallbackHtml = `
      <div lang="tr">
        <h2>Bilet Onayı</h2>
        <p>Biletiniz başarıyla satın alındı.</p>
        <h3>Bilet Detayları:</h3>
        <ul>
          <li>Etkinlik: ${ticketDetails.eventName}</li>
          <li>Tarih: ${ticketDetails.eventDate}</li>
          <li>Koltuk: ${ticketDetails.seatInfo}</li>
          <li>Fiyat: ${ticketDetails.price}₺</li>
        </ul>
      </div>
    `;
    
    const mailOptions = {
      from: '"UpBilet" <info@upbilet.com>',
      to: userEmail,
      subject: 'Bilet Onayı - UpBilet',
      html: fallbackHtml,
    };
    
    return await sendMail(mailOptions);
  }
  
  const mailOptions = {
    from: '"UpBilet" <info@upbilet.com>',
    to: userEmail,
    subject: 'Bilet Onayı - UpBilet',
    html: htmlContent,
  };
  
  return await sendMail(mailOptions);
};

// Bilet teslimat maili
const sendTicketDeliveryEmail = async (userEmail, ticketDetails) => {
  const htmlContent = loadTemplate('email-ticket-delivery', {
    userName: ticketDetails.userName || 'Değerli Müşterimiz',
    eventName: ticketDetails.eventName,
    eventDate: ticketDetails.eventDate,
    downloadLink: ticketDetails.downloadLink,
    orderNumber: ticketDetails.orderNumber
  });
  
  const mailOptions = {
    from: '"UpBilet" <info@upbilet.com>',
    to: userEmail,
    subject: 'Biletleriniz Hazır - UpBilet',
    html: htmlContent || '<div lang="tr"><p>Biletleriniz hazır!</p></div>',
  };
  
  return await sendMail(mailOptions);
};

// Özel template ile mail gönderme
const sendCustomTemplateEmail = async (userEmail, templateName, subject, placeholders) => {
  const htmlContent = loadTemplate(templateName, placeholders);
  
  const mailOptions = {
    from: '"UpBilet" <info@upbilet.com>',
    to: userEmail,
    subject: subject,
    html: htmlContent,
  };
  
  return await sendMail(mailOptions);
};

module.exports = {
  sendMail,
  sendTestMail,
  sendWelcomeEmail,
  sendTicketConfirmationEmail,
  sendTicketDeliveryEmail,
  sendCustomTemplateEmail,
  loadTemplate,
  transporter
};