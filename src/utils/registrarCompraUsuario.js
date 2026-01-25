const User = require("../models/User");
const actualizarCompraConExpiracion = require("./actualizarCompraConExpiracion");

const registrarCompraUsuario = async (userId, items, paymentIntentId) => {
  const agregados = [];
  const yaTenia = [];

  const result = await User.findOneAndUpdate(
    { _id: userId, intentsConfirmados: { $ne: paymentIntentId } },
    { $addToSet: { intentsConfirmados: paymentIntentId } },
    { new: true }
  );

  if (!result) {
    console.log("⚠️ Este PaymentIntent ya fue procesado anteriormente");
    return { agregados: [], yaTenia: [], yaProcesado: true };
  }

  console.log("🧾 Ítems recibidos:", items);

  for (let item of items) {
    console.log("🔍 Analizando item:", item);

    if (!item || !item.id || !item.type) {
      console.warn("❗ Item inválido detectado:", item);
      continue;
    }

    const itemId = item.id.toString();

    const estado = actualizarCompraConExpiracion(result, item.type, itemId);
    console.log(
      `🔁 Resultado de actualizarCompraConExpiracion para ${item.type} ${itemId}:`,
      estado
    );

    if (estado === "agregado" || estado === "renovado") {
      agregados.push(item);
    } else if (estado === "ya_vigente") {
      yaTenia.push(item);
    }

    const tipoTraducido =
      item.type === "course"
        ? "curso"
        : item.type === "formation"
          ? "formacion"
          : item.type === "book"
            ? "libro"
            : item.type;

    const yaAceptado = result.aceptacionTerminos.some(
      (r) => r.itemId.toString() === itemId && r.tipo === tipoTraducido
    );

    if (!yaAceptado) {
      console.log("📝 Registrando aceptación de términos para:", itemId);
      result.aceptacionTerminos.push({
        tipo: tipoTraducido,
        itemId: item.id,
        aceptado: true,
        fecha: new Date(),
      });
    }
  }

  await result.save();
  console.log("✅ Compra registrada con éxito:", { agregados, yaTenia });

  return { agregados, yaTenia, yaProcesado: false };
};

module.exports = registrarCompraUsuario;
