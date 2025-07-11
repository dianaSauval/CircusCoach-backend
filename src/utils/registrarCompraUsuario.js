// utils/registrarCompraUsuario.js
const User = require("../models/User");

const calcularFechaExpiracion = (meses) => {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  // Ajuste para que expire al final del día
  fecha.setHours(23, 59, 59, 999);
  return fecha;
};

const registrarCompraUsuario = async (userId, items, paymentIntentId) => {
  const agregados = [];
  const yaTenia = [];

  const result = await User.findOneAndUpdate(
    { _id: userId, intentsConfirmados: { $ne: paymentIntentId } },
    { $addToSet: { intentsConfirmados: paymentIntentId } },
    { new: true }
  );

  if (!result) {
    return { agregados: [], yaTenia: [], yaProcesado: true };
  }

  for (let item of items) {
    const itemId = item.id.toString();

    const yaAceptado = result.aceptacionTerminos.some(
      (r) => r.itemId.toString() === itemId && r.tipo === item.type
    );

    if (item.type === "course") {
      const yaComprado = result.cursosComprados.some(
        (c) => c.courseId.toString() === itemId
      );
      if (!yaComprado) {
        result.cursosComprados.push({
          courseId: item.id,
          fechaExpiracion: calcularFechaExpiracion(6),
        });
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
      const yaComprado = result.formacionesCompradas.some(
        (f) => f.formationId.toString() === itemId
      );
      if (!yaComprado) {
        result.formacionesCompradas.push({
          formationId: item.id,
          fechaExpiracion: calcularFechaExpiracion(6),
        });
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

  await result.save();
  return { agregados, yaTenia, yaProcesado: false };
};

module.exports = registrarCompraUsuario;
