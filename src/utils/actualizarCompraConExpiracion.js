const calcularFechaExpiracion = (meses) => {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  fecha.setHours(23, 59, 59, 999);
  return fecha;
};

const actualizarCompraConExpiracion = (usuario, tipo, itemId) => {
  // ✅ 1) Mapear tipo -> campo de compras + campo id + meses
  let campoCompras = null;
  let campoId = null;
  let meses = null;

  if (tipo === "course") {
    campoCompras = "cursosComprados";
    campoId = "courseId";
    meses = 6;
  } else if (tipo === "formation") {
    campoCompras = "formacionesCompradas";
    campoId = "formationId";
    meses = 6;
  } else if (tipo === "book") {
    // 📚 Books SIN expiración (según lo que definimos)
    campoCompras = "librosComprados";
    campoId = "bookId";
  } else {
    console.warn("⚠️ Tipo no soportado en actualizarCompraConExpiracion:", tipo);
    return "tipo_no_soportado";
  }

  // ✅ 2) Asegurar el array
  if (!Array.isArray(usuario[campoCompras])) usuario[campoCompras] = [];
  const compras = usuario[campoCompras];

  const index = compras.findIndex(
    (c) => c[campoId]?.toString() === itemId.toString()
  );

  // ✅ 3) Caso BOOK (sin expiración)
  if (tipo === "book") {
    if (index === -1) {
      compras.push({
        [campoId]: itemId,
        purchaseDate: new Date(),
      });
      return "agregado";
    }
    return "ya_vigente";
  }

  // ✅ 4) Caso COURSE / FORMATION (con expiración)
  if (index === -1) {
    compras.push({
      [campoId]: itemId,
      fechaExpiracion: calcularFechaExpiracion(meses),
    });
    return "agregado";
  }

  const compra = compras[index];
  const expirado = new Date(compra.fechaExpiracion) < new Date();

  if (expirado) {
    compras[index].fechaExpiracion = calcularFechaExpiracion(meses);
    return "renovado";
  }

  return "ya_vigente";
};

module.exports = actualizarCompraConExpiracion;
