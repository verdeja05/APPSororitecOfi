const router = require("express").Router();
const Historia = require("../models/Historia");
const Usuaria = require("../models/Usuario");
const authMiddleware = require("../middleware/auth.middleware");

// Ver historias activas de todas
router.get("/", authMiddleware, async (req, res) => {
  try {
    const historias = await Historia.find({
      expira_en: { $gt: new Date() },
    })
      .populate("id_usuaria", "nombre_completo foto_perfil")
      .sort({ fecha_creacion: -1 });

    const porUsuaria = {};
    historias.forEach((h) => {
      const uid = h.id_usuaria._id.toString();
      if (!porUsuaria[uid]) {
        porUsuaria[uid] = {
          id_usuaria: uid,
          nombre: h.id_usuaria.nombre_completo,
          foto_perfil: h.id_usuaria.foto_perfil,
          historias: [],
        };
      }
      porUsuaria[uid].historias.push(h);
    });

    res.json(Object.values(porUsuaria));
  } catch (err) {
    res.status(500).json({ mensaje: "Error", error: err.message });
  }
});

// Crear historia
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { tipo, contenido, imagen_url, color_fondo } = req.body;
    const usuaria = await Usuaria.findById(req.usuaria.id);

    const historia = new Historia({
      id_usuaria: req.usuaria.id,
      nombre_autor: usuaria.nombre_completo,
      foto_autor: usuaria.foto_perfil,
      tipo,
      contenido: contenido || "",
      imagen_url: imagen_url || null,
      color_fondo: color_fondo || "#7C3AED",
    });

    await historia.save();
    res.status(201).json({ mensaje: "Historia creada", historia });
  } catch (err) {
    res.status(500).json({ mensaje: "Error", error: err.message });
  }
});

// Marcar como vista
router.put("/:id/vista", authMiddleware, async (req, res) => {
  try {
    await Historia.findByIdAndUpdate(req.params.id, {
      $addToSet: { vistas: req.usuaria.id },
    });
    res.json({ mensaje: "Vista registrada" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error" });
  }
});

module.exports = router;
