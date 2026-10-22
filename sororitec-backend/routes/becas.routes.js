const router = require('express').Router();
const Beca = require('../models/Beca');
const Inscripcion = require('../models/Inscripcion');
const authMiddleware = require('../middleware/auth.middleware');
const notificar = require('../utils/notificar');

// Ver becas activas
router.get('/', async (req, res) => {
  try {
    const becas = await Beca.find({ estado: 'activa' }).sort({ fecha_publicacion: -1 });
    res.json(becas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver todas (admin)
router.get('/admin/todas', authMiddleware, async (req, res) => {
  try {
    const becas = await Beca.find().sort({ fecha_publicacion: -1 });
    res.json(becas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Mis aplicaciones — ANTES de /:id
router.get('/mis-aplicaciones/becas', authMiddleware, async (req, res) => {
  try {
    const aplicaciones = await Inscripcion.find({
      id_usuaria: req.usuaria.id, tipo: 'beca'
    }).sort({ fecha_inscripcion: -1 });
    res.json(aplicaciones);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Confirmar aplicacion — ANTES de /:id
router.put('/aplicaciones/:id/confirmar', authMiddleware, async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findByIdAndUpdate(
      req.params.id,
      { estado: 'confirmada', fecha_confirmacion: new Date() },
      { new: true }
    );

    await notificar(
      inscripcion.id_usuaria,
      'taller_confirmado',
      'Aplicacion a beca confirmada',
      `Tu aplicacion a la beca "${inscripcion.titulo_referencia}" fue confirmada`,
      inscripcion._id
    );

    res.json({ mensaje: 'Aplicacion confirmada', inscripcion });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Crear beca
router.post('/', authMiddleware, async (req, res) => {
  try {
    const beca = new Beca({ ...req.body, id_administrador: req.usuaria.id });
    await beca.save();
    res.status(201).json({ mensaje: 'Beca creada', beca });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Aplicar a beca
router.post('/:id/aplicar', authMiddleware, async (req, res) => {
  try {
    const beca = await Beca.findById(req.params.id);
    if (!beca) return res.status(404).json({ mensaje: 'Beca no encontrada' });

    const yaAplico = await Inscripcion.findOne({
      id_referencia: req.params.id,
      id_usuaria: req.usuaria.id,
      tipo: 'beca'
    });
    if (yaAplico) return res.status(400).json({ mensaje: 'Ya aplicaste a esta beca' });

    const inscripcion = new Inscripcion({
      tipo: 'beca',
      id_referencia: req.params.id,
      titulo_referencia: beca.nombre,
      id_usuaria: req.usuaria.id,
      ...req.body
    });
    await inscripcion.save();
    res.status(201).json({ mensaje: 'Aplicacion exitosa', inscripcion });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver aplicaciones de una beca (admin)
router.get('/:id/aplicaciones', authMiddleware, async (req, res) => {
  try {
    const aplicaciones = await Inscripcion.find({
      id_referencia: req.params.id, tipo: 'beca'
    }).sort({ fecha_inscripcion: -1 });
    res.json(aplicaciones);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Actualizar beca
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const beca = await Beca.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ mensaje: 'Beca actualizada', beca });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;