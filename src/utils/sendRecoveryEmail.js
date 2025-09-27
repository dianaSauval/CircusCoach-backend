// utils/sendRecoveryEmail.js
require('dotenv').config();
const sendEmailGmail = require('./sendEmailGmail');

// Base del frontend para armar el link (prod o dev)
const FRONTEND_BASE =
  process.env.FRONTEND_BASE_URL || process.env.PUBLIC_FRONTEND_URL || 'http://localhost:5173';

function buildRecoveryLink(token) {
  const base = FRONTEND_BASE.replace(/\/+$/, ''); // sin barra final
  return `${base}/reset-password/${token}`;
}

async function sendRecoveryEmail(to, token) {
  const recoveryLink = buildRecoveryLink(token);
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recuperá tu contraseña</title>
<style>
@media (max-width:600px){ .container{width:100%!important;padding:20px!important} .btn{width:100%!important;text-align:center!important} }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container" style="width:600px;max-width:100%;padding:28px;">
        <tr><td>
          <img src="https://res.cloudinary.com/dkdhdy9e5/image/upload/v1743276367/CircusCoach/Logo_Negro_dm0ski.png"
               alt="CircusCoach" width="140" style="display:block;margin:0 0 16px 0;border:0;outline:none">
          <h1 style="margin:0 0 8px 0;font-family:'Bebas Neue Cyrillic', Bebas Neue, Impact, 'Arial Narrow', sans-serif;
                     text-transform:uppercase;letter-spacing:1px;font-size:28px;color:#143251;">
            ¿Olvidaste tu contraseña?
          </h1>
          <p style="margin:0 0 16px 0;font-family:Lato,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;color:#143251;">
            Hacé clic en el botón para crear una nueva contraseña. Si no solicitaste este cambio, ignorá este mensaje.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border-collapse:collapse;background:#f7fbfb;border:1px solid #e2f0ee;border-radius:12px;">
            <tr><td style="padding:20px;">
              <a class="btn" href="${recoveryLink}" target="_blank"
                 style="display:inline-block;background:#68d0bd;color:#143251;text-decoration:none;font-weight:700;
                        text-transform:uppercase;letter-spacing:.5px;border-radius:999px;padding:12px 22px;">
                Recuperar contraseña
              </a>
              <p style="margin:14px 0 0 0;font-family:Lato,Arial,sans-serif;font-size:13px;color:#6b7a8b;">
                Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
                <a href="${recoveryLink}" style="color:#44838f;text-decoration:none;word-break:break-all;">${recoveryLink}</a>
              </p>
            </td></tr>
          </table>

          <p style="margin:18px 0 0 0;font-family:'Amsterdam Three','Great Vibes','Brush Script MT',cursive;
                    font-size:20px;color:#44838f;">¡Gracias por confiar en nosotros!</p>
          <p style="margin:10px 0 0 0;font-family:Lato,Arial,sans-serif;font-size:12px;color:#6b7a8b;">
            © ${year} CircusCoach by Rocío Garrote
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    'Recuperá tu contraseña - CircusCoach',
    '',
    'Hacé clic en el siguiente enlace para crear una nueva contraseña:',
    recoveryLink,
    '',
    'Si no solicitaste este cambio, ignorá este mensaje.',
    `© ${year} CircusCoach by Rocío Garrote`,
  ].join('\n');

  await sendEmailGmail({
    to,
    subject: 'Recuperá tu contraseña - CircusCoach',
    html,
    text,
    from: process.env.EMAIL_SENDER, // ej: "Soporte CircusCoach <soporte@tudominio.com>"
  });
}

module.exports = { sendRecoveryEmail };
