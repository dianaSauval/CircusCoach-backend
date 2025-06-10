const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendRecoveryEmail = async (to, token) => {
  const recoveryLink = `http://localhost:5173/reset-password/${token}`;

  const msg = {
    to,
    from: process.env.EMAIL_SENDER,
    subject: "Recuperá tu contraseña - CircusCoach",
    html: `
  <div style="background-color:#f4f4f4;padding:30px 20px;font-family:sans-serif;text-align:center;color:#02142B">
    <img src="https://res.cloudinary.com/dkdhdy9e5/image/upload/v1743276367/CircusCoach/Logo_Negro_dm0ski.png" alt="CircusCoach" style="width:150px;margin-bottom:20px;" />

    <div style="background:white;padding:30px 20px;border-radius:10px;max-width:500px;margin:auto;box-shadow:0 5px 15px rgba(0,0,0,0.1)">
      <h2 style="color:#143251;">¿Olvidaste tu contraseña?</h2>
      <p style="font-size:1rem;margin-bottom:20px;">
        Hacé clic en el botón de abajo para crear una nueva contraseña.
      </p>
      <a href="${recoveryLink}" style="display:inline-block;padding:12px 24px;background-color:#68d0bd;color:#fff;text-decoration:none;font-weight:bold;border-radius:8px;font-size:1rem">
        Recuperar contraseña
      </a>
      <p style="font-size:0.9rem;margin-top:30px;color:#666;">
        Si no solicitaste este cambio, podés ignorar este mensaje.
      </p>
    </div>

    <p style="font-size:0.8rem;margin-top:40px;color:#999;">
      © ${new Date().getFullYear()} CircusCoach by Rocío Garrote
    </p>
  </div>
`,
  };

  await sgMail.send(msg);
};

module.exports = { sendRecoveryEmail };
