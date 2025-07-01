// utils/registrarCompraUsuario.js
const registrarCompraUsuario = async (user, items) => {
  const agregados = [];
  const yaTenia = [];

  for (let item of items) {
    const itemId = item.id.toString();

    const yaAceptado = user.aceptacionTerminos.some(
      (r) => r.itemId.toString() === itemId && r.tipo === item.type
    );

    if (item.type === "course") {
      const yaComprado = user.cursosComprados.some(id => id.toString() === itemId);
      if (!yaComprado) {
        user.cursosComprados.push(item.id);
        agregados.push(item);
        if (!yaAceptado) {
          user.aceptacionTerminos.push({
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
      const yaComprado = user.formacionesCompradas.some(id => id.toString() === itemId);
      if (!yaComprado) {
        user.formacionesCompradas.push(item.id);
        agregados.push(item);
        if (!yaAceptado) {
          user.aceptacionTerminos.push({
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

  await user.save();
  return { agregados, yaTenia };
};

module.exports = registrarCompraUsuario;
