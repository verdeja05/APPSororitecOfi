const router = require('express').Router();
const Taller = require('../models/Taller');
const Inscripcion = require('../models/Inscripcion');
const authMiddleware = require('../middleware/auth.middleware');
const notificar = require('../utils/notificar');

// Ver talleres activos (usuarias)
router.get('/', async (req, res) => {
  try {
    const talleres = await Taller.find({ estado: 'activo' }).sort({ fecha_publicacion: -1 });
    res.json(talleres);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver todos (admin)
router.get('/admin/todos', authMiddleware, async (req, res) => {
  try {
    const talleres = await Taller.find().sort({ fecha_publicacion: -1 });
    res.json(talleres);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Mis inscripciones — ANTES de /:id
router.get('/mis-inscripciones/talleres', authMiddleware, async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find({
      id_usuaria: req.usuaria.id, tipo: 'taller'
    }).sort({ fecha_inscripcion: -1 });
    res.json(inscripciones);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Confirmar inscripcion — ANTES de /:id
router.put('/inscripciones/:id/confirmar', authMiddleware, async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findByIdAndUpdate(
      req.params.id,
      { estado: 'confirmada', fecha_confirmacion: new Date() },
      { new: true }
    );
    await notificar(
      inscripcion.id_usuaria,
      'taller_confirmado',
      'Inscripcion confirmada',
      `Tu inscripcion al taller "${inscripcion.titulo_referencia}" fue confirmada`,
      inscripcion._id
    );
    res.json({ mensaje: 'Inscripcion confirmada', inscripcion });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Crear taller
router.post('/', authMiddleware, async (req, res) => {
  try {
    const cupo = parseInt(req.body.cupo_maximo);
    const taller = new Taller({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      categoria: req.body.categoria || 'tecnologia',
      instructor: req.body.instructor,
      fecha_inicio: req.body.fecha_inicio,
      horario: req.body.horario,
      lugar: req.body.lugar,
      modalidad: req.body.modalidad || 'presencial',
      enlace_virtual: req.body.enlace_virtual || null,
      cupo_maximo: cupo,
      cupo_disponible: cupo,
      requisitos: req.body.requisitos || '',
      id_administrador: req.usuaria.id,
    });
    await taller.save();
    res.status(201).json({ mensaje: 'Taller creado', taller });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Inscribirse a taller
router.post('/:id/inscribir', authMiddleware, async (req, res) => {
  try {
    const taller = await Taller.findById(req.params.id);
    if (!taller) return res.status(404).json({ mensaje: 'Taller no encontrado' });
    if (taller.cupo_disponible <= 0) return res.status(400).json({ mensaje: 'No hay cupo disponible' });
    const yaInscrita = await Inscripcion.findOne({
      id_referencia: req.params.id,
      id_usuaria: req.usuaria.id,
      tipo: 'taller'
    });
    if (yaInscrita) return res.status(400).json({ mensaje: 'Ya estas inscrita en este taller' });
    const inscripcion = new Inscripcion({
      tipo: 'taller',
      id_referencia: req.params.id,
      titulo_referencia: taller.titulo,
      id_usuaria: req.usuaria.id,
      ...req.body
    });
    await inscripcion.save();
    taller.cupo_disponible -= 1;
    await taller.save();
    res.status(201).json({ mensaje: 'Inscripcion exitosa', inscripcion });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver inscripciones de un taller (admin)
router.get('/:id/inscripciones', authMiddleware, async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find({
      id_referencia: req.params.id, tipo: 'taller'
    }).sort({ fecha_inscripcion: -1 });
    res.json(inscripciones);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Actualizar taller
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const taller = await Taller.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ mensaje: 'Taller actualizado', taller });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;