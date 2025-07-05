// utils/registrarCompraUsuario.js
const User = require("../models/User"); // asegurate de importar el modelo


const registrarCompraUsuario = async (userId, items, paymentIntentId) => {
  const agregados = [];
  const yaTenia = [];

  // Paso 1: Intentar agregar el paymentIntentId de forma atómica
  const result = await User.findOneAndUpdate(
    { _id: userId, intentsConfirmados: { $ne: paymentIntentId } },
    { $addToSet: { intentsConfirmados: paymentIntentId } },
    { new: true }
  );

  // Si result es null, ya estaba confirmado
  if (!result) {
    return { agregados: [], yaTenia: [], yaProcesado: true };
  }

  // Paso 2: continuar agregando cursos/formaciones
  for (let item of items) {
    const itemId = item.id.toString();

    const yaAceptado = result.aceptacionTerminos.some(
      (r) => r.itemId.toString() === itemId && r.tipo === item.type
    );

    if (item.type === "course") {
      const yaComprado = result.cursosComprados.some(id => id.toString() === itemId);
      if (!yaComprado) {
        result.cursosComprados.push(item.id);
        agregados.push(item);
        if (!yaAceptado) {
          result.aceptacionTerminos.push({
            tipo: "curso",
            itemId: item.id,
            aceptado: true,
            fecha: new Date(),
          });
        }
      } else {
        yaTenia.push(item);
      }
    }

    if (item.type === "formation") {
      const yaComprado = result.formacionesCompradas.some(id => id.toString() === itemId);
      if (!yaComprado) {
        result.formacionesCompradas.push(item.id);
        agregados.push(item);
        if (!yaAceptado) {
          result.aceptacionTerminos.push({
            tipo: "formacion",
            itemId: item.id,
            aceptado: true,
            fecha: new Date(),
          });
        }
      } else {
        yaTenia.push(item);
      }
    }
  }

  // Guardar todo junto al final
  await result.save();

  return { agregados, yaTenia, yaProcesado: false };
};

module.exports = registrarCompraUsuario;