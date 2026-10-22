const router = require('express').Router();
const Notificacion = require('../models/Notificacion');
const authMiddleware = require('../middleware/auth.middleware');

// Ver mis notificaciones
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ id_usuaria: req.usuaria.id })
      .sort({ fecha: -1 })
      .limit(50);
    res.json(notificaciones);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Contar no leidas
router.get('/no-leidas', authMiddleware, async (req, res) => {
  try {
    const total = await Notificacion.countDocuments({
      id_usuaria: req.usuaria.id,
      leida: false
    });
    res.json({ total });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Marcar todas como leidas
router.put('/leer-todas', authMiddleware, async (req, res) => {
  try {
    await Notificacion.updateMany(
      { id_usuaria: req.usuaria.id, leida: false },
      { leida: true }
    );
    res.json({ mensaje: 'Todas marcadas como leidas' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Marcar una como leida
router.put('/:id/leer', authMiddleware, async (req, res) => {
  try {
    await Notificacion.findByIdAndUpdate(req.params.id, { leida: true });
    res.json({ mensaje: 'Marcada como leida' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;