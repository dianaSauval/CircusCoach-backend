const sendEmailGmail = require("./sendEmailGmail");

const LOGO_URL =
  "https://res.cloudinary.com/dkdhdy9e5/image/upload/v1743276367/CircusCoach/Logo_Negro_dm0ski.png";

const getServiceLabel = (serviceType, selectedOption) => {
  const map = {
    "reset-full-program": "RESET – Programa grupal transformador",
    "coaching-single-session": "Coaching 1:1 – Sesión individual",
    "coaching-pack-4": "Coaching 1:1 – Pack de 4 sesiones",
    "coaching-custom": "Coaching 1:1 – Pack personalizado",
    "direction-video-feedback": "Dirección acrobática – Feedback por video",
    "direction-live-session": "Dirección acrobática – Sesión en vivo",
    "direction-creative-process": "Dirección acrobática – Proceso de creación",
  };

  return map[selectedOption] || serviceType || "Servicio personalizado";
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatPrice = (price = 0) => `€${Number(price || 0).toFixed(2)}`;

const buildButton = ({
  href,
  label,
  background = "#68d0bd",
  color = "#143251",
}) => {
  if (!href) return "";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 18px 0 0 0;">
      <tr>
        <td align="center" bgcolor="${background}" style="border-radius:999px;">
          <a
            href="${href}"
            target="_blank"
            style="
              display:inline-block;
              padding:14px 24px;
              font-family:Arial, Helvetica, sans-serif;
              font-size:14px;
              font-weight:700;
              letter-spacing:0.5px;
              text-transform:uppercase;
              color:${color};
              text-decoration:none;
              border-radius:999px;
            "
          >
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
};

const buildInfoBox = (content) => {
  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="
        border-collapse:collapse;
        background:#f7fbfb;
        border:1px solid #d9ece8;
        border-radius:18px;
        margin:18px 0;
      "
    >
      <tr>
        <td style="padding:22px;">
          ${content}
        </td>
      </tr>
    </table>
  `;
};

const buildEmailLayout = ({
  pretitle = "",
  title = "",
  intro = "",
  content = "",
  footerNote = "",
}) => {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    @media (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 20px !important;
      }

      .title {
        font-size: 28px !important;
        line-height: 1.1 !important;
      }

      .mobile-full {
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#edf7f5;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf7f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table
          role="presentation"
          width="620"
          cellpadding="0"
          cellspacing="0"
          class="container"
          style="
            width:620px;
            max-width:100%;
            background:#ffffff;
            border:1px solid #cfe5e1;
            border-radius:28px;
            overflow:hidden;
          "
        >
          <tr>
            <td style="background:#bbdfdb;padding:18px 28px;text-align:center;">
              <img
                src="${LOGO_URL}"
                alt="CircusCoach"
                width="150"
                style="display:block;margin:0 auto;border:0;outline:none;"
              />
            </td>
          </tr>

          <tr>
            <td style="padding:34px 30px 18px 30px;">
              ${
                pretitle
                  ? `
                  <p style="
                    margin:0 0 10px 0;
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:12px;
                    line-height:1.4;
                    letter-spacing:1.5px;
                    text-transform:uppercase;
                    color:#44838f;
                    text-align:center;
                    font-weight:700;
                  ">
                    ${escapeHtml(pretitle)}
                  </p>
                `
                  : ""
              }

              <h1
                class="title"
                style="
                  margin:0 0 14px 0;
                  font-family:'Arial Narrow', Arial, Helvetica, sans-serif;
                  font-size:34px;
                  line-height:1.05;
                  letter-spacing:1px;
                  text-transform:uppercase;
                  color:#143251;
                  text-align:center;
                  font-weight:800;
                "
              >
                ${escapeHtml(title)}
              </h1>

              ${
                intro
                  ? `
                  <p style="
                    margin:0 0 10px 0;
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:16px;
                    line-height:1.7;
                    color:#143251;
                    text-align:center;
                  ">
                    ${intro}
                  </p>
                `
                  : ""
              }

              ${content}

              ${
                footerNote
                  ? `
                  <p style="
                    margin:24px 0 0 0;
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:13px;
                    line-height:1.7;
                    color:#6c7d8a;
                    text-align:center;
                  ">
                    ${footerNote}
                  </p>
                `
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding:0 30px 28px 30px;">
              <p
                style="
                  margin:0;
                  font-family:'Brush Script MT', 'Segoe Script', cursive;
                  font-size:24px;
                  line-height:1.2;
                  color:#44838f;
                  text-align:center;
                "
              >
                Con aprecio,
              </p>
              <p
                style="
                  margin:6px 0 0 0;
                  font-family:Arial, Helvetica, sans-serif;
                  font-size:13px;
                  line-height:1.6;
                  color:#6c7d8a;
                  text-align:center;
                "
              >
                © ${year} CircusCoach by Rocío Garrote
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildClientHtml = ({
  type,
  firstName,
  serviceLabel,
  price,
  paymentUrl = "",
  adminNotes = "",
  whatsappGroupLink = "",
}) => {
  const safeName = escapeHtml(firstName || "hola");
  const safeServiceLabel = escapeHtml(serviceLabel);
  const safeAdminNotes = escapeHtml(adminNotes || "");

  if (type === "received") {
    return buildEmailLayout({
      pretitle: "Solicitud recibida",
      title: "Hemos recibido tu solicitud",
      intro: `Hola ${safeName}, gracias por escribirnos.`,
      content: buildInfoBox(`
        <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
          Tu solicitud para <strong>${safeServiceLabel}</strong> fue recibida correctamente.
        </p>
        <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
          Rocío la revisará personalmente y te responderá lo antes posible.
        </p>
        ${
          price > 0
            ? `
              <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
                <strong>Precio:</strong> ${formatPrice(price)}
              </p>
            `
            : ""
        }
      `),
      footerNote: "Gracias por tu interés y por confiar en este espacio.",
    });
  }

  if (type === "approved") {
    return buildEmailLayout({
      pretitle: "Solicitud aprobada",
      title: "Tu solicitud fue aprobada",
      intro: `Hola ${safeName}, ya podés avanzar con el siguiente paso.`,
      content: buildInfoBox(`
        <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
          Tu solicitud para <strong>${safeServiceLabel}</strong> fue aprobada.
        </p>
        ${
          price > 0
            ? `
              <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
                <strong>Importe a pagar:</strong> ${formatPrice(price)}
              </p>
            `
            : ""
        }
        ${
          adminNotes
            ? `
              <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
                <strong>Mensaje de Rocío:</strong><br />
                ${safeAdminNotes}
              </p>
            `
            : ""
        }

        ${buildButton({
          href: paymentUrl,
          label: "Ir al pago",
          background: "#68d0bd",
          color: "#143251",
        })}

        ${
          paymentUrl
            ? `
              <p style="margin:14px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:1.6;color:#6c7d8a;text-align:left;">
                Este enlace es personal para tu solicitud.
              </p>
            `
            : ""
        }
      `),
      footerNote:
        "Si algo no te queda claro, podés responder este mismo correo.",
    });
  }

  if (type === "rejected") {
    return buildEmailLayout({
      pretitle: "Actualización",
      title: "Por ahora no pudo ser aprobada",
      intro: `Hola ${safeName}, gracias por tu interés y tu tiempo.`,
      content: buildInfoBox(`
        <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
          En este momento tu solicitud para <strong>${safeServiceLabel}</strong> no pudo ser aprobada.
        </p>
        ${
          adminNotes
            ? `
              <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
                <strong>Mensaje de Rocío:</strong><br />
                ${safeAdminNotes}
              </p>
            `
            : ""
        }
      `),
      footerNote:
        "Ojalá podamos coincidir más adelante en otro momento o formato de trabajo.",
    });
  }

  if (type === "paid") {
    const isReset = safeServiceLabel.toLowerCase().includes("reset");

    return buildEmailLayout({
      pretitle: "Pago confirmado",
      title: "Pago recibido correctamente",
      intro: `Hola ${safeName}, ya quedó todo confirmado.`,
      content: buildInfoBox(`
        <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
          Se confirmó el pago de tu solicitud para <strong>${safeServiceLabel}</strong>.
        </p>

        ${
          price > 0
            ? `
              <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
                <strong>Importe abonado:</strong> ${formatPrice(price)}
              </p>
            `
            : ""
        }

        <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
          ${
            isReset
              ? "Tu lugar quedó reservado correctamente."
              : "Rocío se pondrá en contacto con vos para coordinar los próximos pasos."
          }
        </p>

        ${
          isReset && whatsappGroupLink
            ? `
              <p style="margin:0 0 12px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
                Ya podés sumarte al grupo de WhatsApp del programa desde el siguiente botón:
              </p>
              ${buildButton({
                href: whatsappGroupLink,
                label: "Unirme al grupo de WhatsApp",
                background: "#25D366",
                color: "#ffffff",
              })}
            `
            : ""
        }

        ${
          isReset && !whatsappGroupLink
            ? `
              <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
                En breve recibirás la información de acceso y organización del programa.
              </p>
            `
            : ""
        }
      `),
      footerNote:
        "Gracias por estar acá. Qué alegría acompañarte en este proceso.",
    });
  }

  return buildEmailLayout({
    title: "Notificación",
    content: `<p style="font-family:Arial, Helvetica, sans-serif;font-size:15px;color:#143251;">Hubo una actualización.</p>`,
  });
};

const buildAdminHtml = ({
  firstName,
  lastName,
  email,
  whatsapp,
  serviceLabel,
  price,
  experience,
  message,
}) => {
  return buildEmailLayout({
    pretitle: "Nueva solicitud",
    title: "Nueva solicitud personalizada",
    intro: "Se recibió una nueva solicitud desde la web.",
    content: buildInfoBox(`
      <p style="margin:0 0 10px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
        <strong>Nombre:</strong> ${escapeHtml(firstName || "")} ${escapeHtml(lastName || "")}
      </p>
      <p style="margin:0 0 10px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
        <strong>Email:</strong> ${escapeHtml(email || "-")}
      </p>
      <p style="margin:0 0 10px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
        <strong>WhatsApp:</strong> ${escapeHtml(whatsapp || "-")}
      </p>
      <p style="margin:0 0 10px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
        <strong>Servicio:</strong> ${escapeHtml(serviceLabel || "-")}
      </p>
      <p style="margin:0 0 10px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
        <strong>Precio:</strong> ${formatPrice(price)}
      </p>
      <p style="margin:0 0 10px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
        <strong>Experiencia previa:</strong><br />
        ${escapeHtml(experience || "-")}
      </p>
      <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.7;color:#143251;text-align:left;">
        <strong>Mensaje:</strong><br />
        ${escapeHtml(message || "-")}
      </p>
    `),
    footerNote:
      "Revisá la solicitud desde el panel para aprobarla o rechazarla.",
  });
};

const buildClientText = ({
  type,
  firstName,
  serviceLabel,
  price,
  paymentUrl = "",
  adminNotes = "",
  whatsappGroupLink = "",
}) => {
  const lines = [];

  if (type === "received") {
    lines.push(
      "Hemos recibido tu solicitud",
      "",
      `Hola ${firstName || ""},`,
      `Tu solicitud para ${serviceLabel} fue recibida correctamente.`,
      "Rocío la revisará y te responderá lo antes posible.",
    );

    if (price > 0) lines.push(`Precio: ${formatPrice(price)}`);
  }

  if (type === "approved") {
    lines.push(
      "Tu solicitud fue aprobada",
      "",
      `Hola ${firstName || ""},`,
      `Tu solicitud para ${serviceLabel} fue aprobada.`,
    );

    if (price > 0) lines.push(`Importe a pagar: ${formatPrice(price)}`);
    if (adminNotes) lines.push(`Mensaje de Rocío: ${adminNotes}`);
    if (paymentUrl) {
      lines.push(
        "",
        "Ir al pago:",
        paymentUrl,
        "",
        "Este enlace es personal para tu solicitud.",
      );
    }
  }

  if (type === "rejected") {
    lines.push(
      "Actualización sobre tu solicitud",
      "",
      `Hola ${firstName || ""},`,
      `En este momento tu solicitud para ${serviceLabel} no pudo ser aprobada.`,
    );

    if (adminNotes) lines.push(`Mensaje de Rocío: ${adminNotes}`);
  }

  if (type === "paid") {
    lines.push(
      "Pago recibido correctamente",
      "",
      `Hola ${firstName || ""},`,
      `Se confirmó el pago de tu solicitud para ${serviceLabel}.`,
    );

    if (price > 0) lines.push(`Importe abonado: ${formatPrice(price)}`);

    if (serviceLabel.toLowerCase().includes("reset")) {
      lines.push("Tu lugar quedó reservado correctamente.");

      if (whatsappGroupLink) {
        lines.push("", "Sumate al grupo de WhatsApp:", whatsappGroupLink);
      } else {
        lines.push(
          "En breve recibirás la información de acceso y organización del programa.",
        );
      }
    } else {
      lines.push(
        "Rocío se pondrá en contacto con vos para coordinar los próximos pasos.",
      );
    }
  }

  lines.push("", "CircusCoach by Rocío Garrote");
  return lines.join("\n");
};

const buildAdminText = ({
  firstName,
  lastName,
  email,
  whatsapp,
  serviceLabel,
  price,
  experience,
  message,
}) => {
  return [
    "Nueva solicitud personalizada",
    "",
    `Nombre: ${firstName || ""} ${lastName || ""}`.trim(),
    `Email: ${email || "-"}`,
    `WhatsApp: ${whatsapp || "-"}`,
    `Servicio: ${serviceLabel || "-"}`,
    `Precio: ${formatPrice(price)}`,
    `Experiencia previa: ${experience || "-"}`,
    `Mensaje: ${message || "-"}`,
  ].join("\n");
};

const sendPersonalizedServiceEmail = async ({
  type,
  to,
  firstName,
  lastName = "",
  email = "",
  whatsapp = "",
  serviceType,
  selectedOption,
  price = 0,
  paymentUrl = "",
  adminNotes = "",
  experience = "",
  message = "",
  whatsappGroupLink = "",
}) => {
  const serviceLabel = getServiceLabel(serviceType, selectedOption);

  let subject = "Actualización de tu solicitud";
  let html = "";
  let text = "";

  if (type === "received") {
    subject = "Hemos recibido tu solicitud";
    html = buildClientHtml({
      type,
      firstName,
      serviceLabel,
      price,
    });
    text = buildClientText({
      type,
      firstName,
      serviceLabel,
      price,
    });
  }

  if (type === "approved") {
    subject = "Tu solicitud fue aprobada";
    html = buildClientHtml({
      type,
      firstName,
      serviceLabel,
      price,
      paymentUrl,
      adminNotes,
    });
    text = buildClientText({
      type,
      firstName,
      serviceLabel,
      price,
      paymentUrl,
      adminNotes,
    });
  }

  if (type === "rejected") {
    subject = "Actualización sobre tu solicitud";
    html = buildClientHtml({
      type,
      firstName,
      serviceLabel,
      price,
      adminNotes,
    });
    text = buildClientText({
      type,
      firstName,
      serviceLabel,
      price,
      adminNotes,
    });
  }

  if (type === "paid") {
    subject = "Pago recibido correctamente";
    html = buildClientHtml({
      type,
      firstName,
      serviceLabel,
      price,
      whatsappGroupLink,
    });
    text = buildClientText({
      type,
      firstName,
      serviceLabel,
      price,
      whatsappGroupLink,
    });
  }

  if (type === "admin-new-request") {
    subject = "Nueva solicitud personalizada recibida";
    html = buildAdminHtml({
      firstName,
      lastName,
      email,
      whatsapp,
      serviceLabel,
      price,
      experience,
      message,
    });
    text = buildAdminText({
      firstName,
      lastName,
      email,
      whatsapp,
      serviceLabel,
      price,
      experience,
      message,
    });
  }

  return sendEmailGmail({
    to,
    subject,
    html,
    text,
    from: process.env.EMAIL_SENDER,
  });
};

module.exports = sendPersonalizedServiceEmail;
