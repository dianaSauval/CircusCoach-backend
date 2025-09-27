// utils/sendEmailGmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

// Ambiente
const isProd = process.env.NODE_ENV === 'production';

// En local, podés usar ALLOW_SELF_SIGNED=true si Norton molesta.
// En prod esto SIEMPRE queda false (o sin definir).
const allowSelfSigned = !isProd && process.env.ALLOW_SELF_SIGNED === 'true';

// Sanity checks
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error('Faltan GMAIL_USER o GMAIL_APP_PASSWORD en variables de entorno');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,          // STARTTLS
  secure: false,      // STARTTLS (TLS se negocia luego)
  requireTLS: true,   // obligamos a subir a TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // App Password (no la clave normal)
  },
  tls: allowSelfSigned
    ? { rejectUnauthorized: false }      // SOLO en dev si Norton intercepta
    : { minVersion: 'TLSv1.2', servername: 'smtp.gmail.com' }, // SNI + TLS estricto
});

module.exports = async function sendEmailGmail({ to, subject, html, from }) {
  const info = await transporter.sendMail({
    from: from || process.env.EMAIL_SENDER || `"CircusCoach" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return info;
};
