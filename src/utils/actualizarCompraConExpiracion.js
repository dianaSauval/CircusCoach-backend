const calcularFechaExpiracion = (meses) => {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  fecha.setHours(23, 59, 59, 999);
  return fecha;
};

const actualizarCompraConExpiracion = (usuario, tipo, itemId) => {
  const campoCompras =
    tipo === "course" ? "cursosComprados" : "formacionesCompradas";
  const campoId =
    tipo === "course" ? "courseId" : "formationId";

  const compras = usuario[campoCompras];

  const index = compras.findIndex(
    (c) => c[campoId].toString() === itemId.toString()
  );

  if (index === -1) {
    // No lo tenía
    compras.push({
      [campoId]: itemId,
      fechaExpiracion: calcularFechaExpiracion(6),
    });
    return "agregado";
  }

  const compra = compras[index];
  const expirado = new Date(compra.fechaExpiracion) < new Date();

  if (expirado) {
    compras[index].fechaExpiracion = calcularFechaExpiracion(6);
    return "renovado";
  }

  return "ya_vigente";
};

module.exports = actualizarCompraConExpiracion;
