// utils/sendPurchaseEmail.js
const sendEmailGmail = require("./sendEmailGmail");

function eur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

module.exports = async function sendPurchaseEmail({ to, buyer, order, vendor, policyLinks }) {
  const rows = (order.items || [])
    .map(
      (i) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8eef2;">
            <div style="font-size:15px;color:#143251;"><strong>${i.title}</strong></div>
            <div style="font-size:12px;color:#6b7a8b;">${i.type || "Item"}${i.sku ? ` · ${i.sku}` : ""}</div>
          </td>
          <td style="padding:12px 0;text-align:center;border-bottom:1px solid #e8eef2;color:#143251;">${i.qty || 1}</td>
          <td style="padding:12px 0;text-align:right;border-bottom:1px solid #e8eef2;color:#143251;">${eur(i.price)}</td>
        </tr>`
    )
    .join("");

  const shippingRow = order.shipping
    ? `<tr>
         <td></td>
         <td style="text-align:right;padding:6px 0;color:#143251;">Gastos</td>
         <td style="text-align:right;padding:6px 0;color:#143251;">${eur(order.shipping)}</td>
       </tr>`
    : "";

  const taxesRow = order.taxes
    ? `<tr>
         <td></td>
         <td style="text-align:right;padding:6px 0;color:#143251;">Impuestos</td>
         <td style="text-align:right;padding:6px 0;color:#143251;">${eur(order.taxes)}</td>
       </tr>`
    : "";

  const accessCta = order.accessUrl
    ? `<tr>
         <td colspan="3" style="padding-top:16px;">
           <a href="${order.accessUrl}" target="_blank"
              style="display:inline-block;background:#68d0bd;color:#143251;text-decoration:none;font-weight:700;
                     text-transform:uppercase;letter-spacing:.5px;border-radius:999px;padding:12px 22px;">
             Acceder a mi contenido
           </a>
         </td>
       </tr>`
    : "";

  const year = new Date().getFullYear();
  const accessDate = order.deliveryOrAccessDate || "inmediata";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de compra</title>
  <style>
    /* Algunos clientes ignoran <style>, pero ayuda donde se soporta */
    @media (max-width:600px){
      .container { width:100% !important; padding:20px !important; }
      .h1 { font-size:26px !important; }
      .sub { font-size:14px !important; }
      .btn { width:100% !important; text-align:center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container"
               style="width:600px;max-width:100%;padding:28px;">
          <tr>
            <td style="padding:0;">
              <!-- Header -->
              <table role="presentation" width="100%">
                <tr>
                  <td style="padding:0 0 12px 0;">
                    <img src="https://res.cloudinary.com/dkdhdy9e5/image/upload/v1743276367/CircusCoach/Logo_Negro_dm0ski.png"
                         alt="CircusCoach" width="140" style="display:block;border:0;outline:none;text-decoration:none;">
                  </td>
                </tr>
              </table>

              <!-- Título -->
              <h1 class="h1" style="margin:0 0 6px 0;font-family:'Bebas Neue Cyrillic', Bebas Neue, Impact, 'Arial Narrow', sans-serif;
                                   text-transform:uppercase;letter-spacing:1px;font-size:30px;line-height:1.2;color:#143251;">
                Confirmación de compra
              </h1>
              <p class="sub" style="margin:0 0 18px 0;font-family:Lato,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;color:#143251;">
                Hola ${buyer.name} ${buyer.surname}, ¡gracias por tu compra en
                <strong style="color:#44838f;">${vendor.tradeName}</strong>!
              </p>

              <!-- Resumen -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="border-collapse:collapse;background:#f7fbfb;border:1px solid #e2f0ee;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:18px;">
                    <h2 style="margin:0 0 8px 0;font-family:'Bebas Neue Cyrillic', Bebas Neue, Impact, 'Arial Narrow', sans-serif;
                               text-transform:uppercase;letter-spacing:.5px;font-size:20px;color:#143251;">
                      Resumen del pedido
                    </h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="padding:8px 0;border-bottom:2px solid #cfe7e4;font-family:Lato,Arial,sans-serif;
                                                 font-size:12px;color:#6b7a8b;text-transform:uppercase;letter-spacing:.4px;">
                            Producto/Servicio
                          </th>
                          <th align="center" style="padding:8px 0;border-bottom:2px solid #cfe7e4;font-family:Lato,Arial,sans-serif;
                                                   font-size:12px;color:#6b7a8b;text-transform:uppercase;letter-spacing:.4px;">
                            Cant.
                          </th>
                          <th align="right" style="padding:8px 0;border-bottom:2px solid #cfe7e4;font-family:Lato,Arial,sans-serif;
                                                  font-size:12px;color:#6b7a8b;text-transform:uppercase;letter-spacing:.4px;">
                            Importe
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rows}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td></td>
                          <td style="text-align:right;padding:10px 0;font-family:Lato,Arial,sans-serif;color:#143251;">Subtotal</td>
                          <td style="text-align:right;padding:10px 0;font-family:Lato,Arial,sans-serif;color:#143251;">${eur(order.subtotal)}</td>
                        </tr>
                        ${shippingRow}
                        ${taxesRow}
                        <tr>
                          <td></td>
                          <td style="text-align:right;padding:10px 0;font-family:Lato,Arial,sans-serif;color:#143251;font-weight:700;">Total</td>
                          <td style="text-align:right;padding:10px 0;font-family:Lato,Arial,sans-serif;color:#143251;font-weight:700;">${eur(order.total)}</td>
                        </tr>
                        ${accessCta}
                      </tfoot>
                    </table>

                    <p style="margin:14px 0 0 0;font-family:Lato,Arial,sans-serif;font-size:14px;line-height:1.6;color:#143251;">
                      <strong>Modalidad de ejecución/entrega:</strong> acceso digital a tu contenido.
                      Fecha estimada: <strong>${accessDate}</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Datos del vendedor -->
              <table role="presentation" width="100%" style="margin-top:22px;">
                <tr>
                  <td style="padding:0;">
                    <h2 style="margin:0 0 8px 0;font-family:'Bebas Neue Cyrillic', Bebas Neue, Impact, 'Arial Narrow', sans-serif;
                               text-transform:uppercase;letter-spacing:.5px;font-size:20px;color:#143251;">
                      Datos del vendedor
                    </h2>
                    <p style="margin:0;font-family:Lato,Arial,sans-serif;font-size:14px;line-height:1.7;color:#143251;">
                      <strong style="color:#44838f;">${vendor.tradeName}</strong><br>
                      Nº empresa/IVA: ${vendor.vat}<br>
                      Dirección: ${vendor.address}<br>
                      Email: <a href="mailto:${vendor.email}" style="color:#44838f;text-decoration:none;">${vendor.email}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Legal -->
              <table role="presentation" width="100%" style="margin-top:22px;">
                <tr>
                  <td style="padding:0;">
                    <h2 style="margin:0 0 8px 0;font-family:'Bebas Neue Cyrillic', Bebas Neue, Impact, 'Arial Narrow', sans-serif;
                               text-transform:uppercase;letter-spacing:.5px;font-size:20px;color:#143251;">
                      Información legal
                    </h2>
                    <ul style="margin:0 0 12px 18px;padding:0;font-family:Lato,Arial,sans-serif;font-size:13px;line-height:1.7;color:#143251;">
                      <li>Cómo presentar <strong>reclamos</strong>: ${vendor.claimsEmail}</li>
                      <li><strong>Desistimiento</strong>: no aplica a productos digitales una vez entregados (ver condiciones completas).</li>
                      <li><strong>Garantía legal</strong>: conforme a la normativa aplicable (ver condiciones).</li>
                      <li>Resolución de litigios: plataforma europea ODR.</li>
                    </ul>
                    <p style="margin:0 0 14px 0;font-family:Lato,Arial,sans-serif;font-size:13px;line-height:1.7;">
                      Revisa las
                      <a href="${policyLinks.termsUrl}" style="color:#44838f;text-decoration:none;">Condiciones Generales de Venta</a>
                      ${policyLinks.privacyUrl ? ` · <a href="${policyLinks.privacyUrl}" style="color:#44838f;text-decoration:none;">Política de Privacidad</a>` : ""}
                      ${policyLinks.refundUrl ? ` · <a href="${policyLinks.refundUrl}" style="color:#44838f;text-decoration:none;">Política de Reembolsos</a>` : ""}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Firma -->
              <p style="margin:18px 0 0 0;font-family:'Amsterdam Three','Great Vibes','Brush Script MT',cursive;
                        font-size:20px;color:#44838f;">
                ¡Gracias por elegirnos!
              </p>

              <!-- Footer -->
              <p style="margin:16px 0 0 0;font-family:Lato,Arial,sans-serif;font-size:12px;color:#6b7a8b;">
                © ${year} ${vendor.tradeName}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Texto plano (fallback)
  const text = [
    `Confirmación de compra - ${vendor.tradeName}`,
    `Hola ${buyer.name} ${buyer.surname}, gracias por tu compra.`,
    ``,
    `RESUMEN:`,
    ...(order.items || []).map(
      (i) => `- ${i.title} (${i.type || "Item"}) x${i.qty || 1}: ${eur(i.price)}`
    ),
    ``,
    `Subtotal: ${eur(order.subtotal)}`,
    order.shipping ? `Gastos: ${eur(order.shipping)}` : null,
    order.taxes ? `Impuestos: ${eur(order.taxes)}` : null,
    `Total: ${eur(order.total)}`,
    ``,
    `Entrega/acceso: ${accessDate}${order.accessUrl ? ` · Acceso: ${order.accessUrl}` : ""}`,
    ``,
    `Vendedor: ${vendor.tradeName} · IVA: ${vendor.vat}`,
    `Dirección: ${vendor.address}`,
    `Email: ${vendor.email}`,
    ``,
    `Condiciones: ${policyLinks.termsUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmailGmail({
    to,
    subject: "Confirmación de compra - CircusCoach",
    html,
    text,
    from: process.env.EMAIL_SENDER,
  });

  return { provider: "gmail" };
};
