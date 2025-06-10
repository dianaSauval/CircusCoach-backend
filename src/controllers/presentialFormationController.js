const PresentialFormation = require('../models/PresentialFormation');

const isAdmin = (req) => req.user && req.user.role === "admin";

//Obtener todas las formaciones presenciales (público)
const getAllPresentialFormations = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });
    try {
        const formations = await PresentialFormation.aggregate([
            {
              $addFields: {
                sortDate: {
                  $cond: [
                    { $eq: ['$dateType', 'single'] },
                    '$singleDate',
                    '$dateRange.start'
                  ]
                }
              }
            },
            { $sort: { sortDate: 1 } }
          ]);
          
      res.json(formations);
    } catch (error) {
        console.error('Error en getAllPresentialFormations:', error.message || error);
        res.status(500).json({
          message: 'Error al obtener las formaciones',
          error: error.message || 'Error desconocido'
        });
      }
      
  };
  
  // 🔹 Obtener formaciones presenciales visibles por idioma (público)
const getVisiblePresentialFormations = async (req, res) => {
  const lang = req.query.lang || "es";

  try {
    const formations = await PresentialFormation.aggregate([
      {
        $addFields: {
          sortDate: {
            $cond: [
              { $eq: ["$dateType", "single"] },
              "$singleDate",
              "$dateRange.start"
            ]
          }
        }
      },
      { $sort: { sortDate: 1 } }
    ]);

    // Formateamos solo los campos del idioma correspondiente
    const formatted = formations.map(f => ({
      _id: f._id,
      title: f.title?.[lang] || "",
      description: f.description?.[lang] || "",
      location: f.location?.[lang] || "",
      dateType: f.dateType,
      singleDate: f.singleDate,
      dateRange: f.dateRange,
      time: f.time,
      registrationLink: f.registrationLink,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error en getVisiblePresentialFormations:", error.message || error);
    res.status(500).json({
      message: "Error al obtener las formaciones presenciales",
      error: error.message || "Error desconocido"
    });
  }
};

  

// Crear una formación presencial (admin)
const createPresentialFormation = async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });
    try {
      const newFormation = new PresentialFormation(req.body);
      await newFormation.save();
      res.status(201).json(newFormation);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear la formación', error });
    }
  };

  // Editar una formación presencial por ID (admin)
  const updatePresentialFormation = async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });
    try {
      const { id } = req.params;
      const updatedFormation = await PresentialFormation.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedFormation) {
        return res.status(404).json({ message: 'Formación no encontrada' });
      }
      res.json(updatedFormation);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar la formación', error });
    }
  };

  // Eliminar una formación presencial por ID (admin)
  const deletePresentialFormation = async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });
    try {
      const { id } = req.params;
      const deletedFormation = await PresentialFormation.findByIdAndDelete(id);
      if (!deletedFormation) {
        return res.status(404).json({ message: 'Formación no encontrada' });
      }
      res.json({ message: 'Formación eliminada correctamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar la formación', error });
    }
  };

  module.exports = {
    getAllPresentialFormations,
    getVisiblePresentialFormations,
    createPresentialFormation,
    updatePresentialFormation,
    deletePresentialFormation
  };
  