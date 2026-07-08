const router = require("express").Router();
const Usuaria = require("../models/Usuario");
const authMiddleware = require("../middleware/auth.middleware");

// Ver mi perfil
router.get("/mi-perfil", authMiddleware, async (req, res) => {
  try {
    const usuaria = await Usuaria.findById(req.usuaria.id).select(
      "-contrasena_hash",
    );
    res.json(usuaria);
  } catch (err) {
    res.status(500).json({ mensaje: "Error", error: err.message });
  }
});

// Actualizar perfil
router.put("/actualizar", authMiddleware, async (req, res) => {
  try {
    const { bio, carrera, cuatrimestre, telefono, foto_perfil } = req.body;
    const usuaria = await Usuaria.findByIdAndUpdate(
      req.usuaria.id,
      { bio, carrera, cuatrimestre, telefono, foto_perfil },
      { new: true },
    ).select("-contrasena_hash");
    res.json({ mensaje: "Perfil actualizado", usuaria });
  } catch (err) {
    res.status(500).json({ mensaje: "Error", error: err.message });
  }
});

// Ver perfil de otra usuaria
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const usuaria = await Usuaria.findById(req.params.id).select(
      "-contrasena_hash -correo_institucional -contrasena_hash",
    );
    res.json(usuaria);
  } catch (err) {
    res.status(500).json({ mensaje: "Error", error: err.message });
  }
});

module.exports = router;
