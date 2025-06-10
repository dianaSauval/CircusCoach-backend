exports.markClassAsCompleted = async (req, res) => {
    try {
      const { classId } = req.body;
      const userId = req.user.id;
      const { purchase } = req; // Viene del middleware checkAccessToFormation
  
      // Marcar la clase como completada
      purchase.progress.set(classId, true);
      await purchase.save();
  
      res.json({ message: "Clase marcada como completada." });
    } catch (error) {
      console.error("Error actualizando progreso:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  };
  
