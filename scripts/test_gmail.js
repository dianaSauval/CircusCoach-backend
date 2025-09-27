// scripts/test_gmail.js
require('dotenv').config();
const sendEmailGmail = require('../src/utils/sendEmailGmail');

(async () => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Faltan GMAIL_USER o GMAIL_APP_PASSWORD en .env');
    }
    const info = await sendEmailGmail({
      to: process.env.GMAIL_USER,
      subject: 'Prueba SMTP Gmail',
      html: '<p>Hola, esto es una prueba</p>',
    });
    console.log('OK', info.messageId);
  } catch (e) {
    console.error('FALLÓ', e);
  }
})();
