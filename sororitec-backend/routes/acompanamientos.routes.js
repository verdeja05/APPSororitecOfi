const router = require('express').Router();
const Acompanamiento = require('../models/Acompanamiento');
const Usuaria = require('../models/Usuaria');
const authMiddleware = require('../middleware/auth.middleware');

// Solicitar acompañamiento
router.post('/solicitar', authMiddleware, async (req, res) => {
  try {
    const { latitud, longitud, descripcion } = req.body;
    const usuaria = await Usuaria.findById(req.usuaria.id);
    const acompanamiento = new Acompanamiento({
      id_usuaria: req.usuaria.id,
      nombre_usuaria: usuaria.nombre_completo,
      ubicacion_usuaria: { latitud, longitud },
      descripcion: descripcion || ''
    });
    await acompanamiento.save();
    res.status(201).json({ mensaje: 'Solicitud enviada', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al solicitar', error: err.message });
  }
});

// Ver solicitudes pendientes
router.get('/pendientes', authMiddleware, async (req, res) => {
  try {
    const solicitudes = await Acompanamiento.find({ estado: 'pendiente' })
      .populate('id_usuaria', 'nombre_completo')
      .sort({ fecha_solicitud: -1 });
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener solicitudes' });
  }
});

router.get('/pendientes', authMiddleware, async (req, res) => {
  try {
    const solicitudes = await Acompanamiento.find({ estado: 'pendiente' })
      .populate('id_usuaria', 'nombre_completo')
      .sort({ fecha_solicitud: -1 });
    res.json(solicitudes);
  } catch (err) {
    console.error('ERROR PENDIENTES:', err.message);  // <-- agrega esto
    res.status(500).json({ mensaje: 'Error al obtener solicitudes', error: err.message });
  }
});

// Ver mis solicitudes
router.get('/mis-solicitudes', authMiddleware, async (req, res) => {
  try {
    const solicitudes = await Acompanamiento.find({ id_usuaria: req.usuaria.id })
      .sort({ fecha_solicitud: -1 });
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener solicitudes' });
  }
});

// Ver detalle de un acompañamiento
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findById(req.params.id)
      .populate('id_usuaria', 'nombre_completo')
      .populate('id_acompanante', 'nombre_completo');
    res.json(acompanamiento);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener detalle' });
  }
});

// Aceptar solicitud
router.put('/aceptar/:id', authMiddleware, async (req, res) => {
  try {
    const { latitud, longitud } = req.body;
    const acompanante = await Usuaria.findById(req.usuaria.id);
    const acompanamiento = await Acompanamiento.findByIdAndUpdate(
      req.params.id,
      {
        id_acompanante: req.usuaria.id,
        nombre_acompanante: acompanante.nombre_completo,
        estado: 'aceptado',
        ubicacion_acompanante: { latitud, longitud },
        fecha_aceptacion: new Date()
      },
      { new: true }
    );
    res.json({ mensaje: 'Solicitud aceptada', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al aceptar' });
  }
});

// Iniciar acompañamiento
router.put('/iniciar/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findByIdAndUpdate(
      req.params.id,
      { estado: 'en_curso', fecha_inicio: new Date() },
      { new: true }
    );
    res.json({ mensaje: 'Acompañamiento iniciado', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al iniciar' });
  }
});

// Finalizar acompañamiento
router.put('/finalizar/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findByIdAndUpdate(
      req.params.id,
      { estado: 'completado', fecha_fin: new Date() },
      { new: true }
    );
    res.json({ mensaje: 'Acompañamiento finalizado', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al finalizar' });
  }
});

// Actualizar ubicación en tiempo real
router.put('/ubicacion/:id', authMiddleware, async (req, res) => {
  try {
    const { latitud, longitud, tipo } = req.body;
    const update = tipo === 'acompanante'
      ? { 'ubicacion_acompanante.latitud': latitud, 'ubicacion_acompanante.longitud': longitud }
      : { 'ubicacion_usuaria.latitud': latitud, 'ubicacion_usuaria.longitud': longitud };
    await Acompanamiento.findByIdAndUpdate(req.params.id, update);
    res.json({ mensaje: 'Ubicación actualizada' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar ubicación' });
  }
});

// Registrar como disponible
router.post('/registrar-disponible', authMiddleware, async (req, res) => {
  try {
    const { latitud, longitud } = req.body;
    await Usuaria.findByIdAndUpdate(req.usuaria.id, {
      disponible_acompanante: true,
      ubicacion_actual: { latitud, longitud }
    });
    res.json({ mensaje: 'Registrada como disponible' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

router.get('/disponibles', authMiddleware, async (req, res) => {
  try {
    const disponibles = await Usuaria.find(
      { disponible_acompanante: true, _id: { $ne: req.usuaria.id } },
      'nombre_completo ubicacion_actual'
    );
    res.json(disponibles);
  } catch (err) {
    console.error('ERROR DISPONIBLES:', err.message);  // <-- agrega esto
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver acompañantes disponibles
router.get('/disponibles', authMiddleware, async (req, res) => {
  try {
    const disponibles = await Usuaria.find(
      { disponible_acompanante: true, _id: { $ne: req.usuaria.id } },
      'nombre_completo ubicacion_actual'
    );
    res.json(disponibles);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;