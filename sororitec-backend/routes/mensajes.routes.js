const router = require('express').Router();
const Mensaje = require('../models/Mensaje');
const Acompanamiento = require('../models/Acompanamiento');
const Usuaria = require('../models/Usuaria');
const authMiddleware = require('../middleware/auth.middleware');

// Obtener mensajes de un acompañamiento
router.get('/:id_acompanamiento', authMiddleware, async (req, res) => {
  try {
    const mensajes = await Mensaje.find({
      id_acompanamiento: req.params.id_acompanamiento
    }).sort({ fecha: 1 });
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Enviar mensaje
router.post('/:id_acompanamiento', authMiddleware, async (req, res) => {
  try {
    const { texto } = req.body;
    const usuaria = await Usuaria.findById(req.usuaria.id);

    // Verificar que pertenece al acompañamiento
    const acompanamiento = await Acompanamiento.findById(req.params.id_acompanamiento);
    if (!acompanamiento) return res.status(404).json({ mensaje: 'No encontrado' });

    const esParticipante =
      acompanamiento.id_usuaria.toString() === req.usuaria.id ||
      acompanamiento.id_acompanante?.toString() === req.usuaria.id;

    if (!esParticipante) return res.status(403).json({ mensaje: 'No autorizada' });
    if (acompanamiento.estado === 'completado' || acompanamiento.estado === 'cancelado') {
      return res.status(400).json({ mensaje: 'El acompañamiento ya terminó' });
    }

    const mensaje = new Mensaje({
      id_acompanamiento: req.params.id_acompanamiento,
      id_usuaria: req.usuaria.id,
      nombre: usuaria.nombre_completo,
      texto
    });
    await mensaje.save();
    res.status(201).json(mensaje);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;