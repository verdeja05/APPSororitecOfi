const router = require('express').Router();
const Acompanamiento = require('../models/Acompanamiento');
const Usuaria = require('../models/Usuaria');
const authMiddleware = require('../middleware/auth.middleware');

// Registrar como disponible
router.post('/registrar-disponible', authMiddleware, async (req, res) => {
  try {
    const { latitud, longitud } = req.body;
    await Usuaria.findByIdAndUpdate(req.usuaria.id, {
      disponible_acompanante: true,
      ubicacion_actual: { latitud, longitud, actualizado: new Date() }
    });
    res.json({ mensaje: 'Registrada como disponible' });
  } catch (err) {
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
      .populate('id_usuaria', 'nombre_completo foto_perfil')
      .sort({ fecha_solicitud: -1 });
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver mis solicitudes
router.get('/mis-solicitudes', authMiddleware, async (req, res) => {
  try {
    const solicitudes = await Acompanamiento.find({ id_usuaria: req.usuaria.id })
      .populate('id_acompanante', 'nombre_completo foto_perfil ubicacion_actual')
      .sort({ fecha_solicitud: -1 });
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver acompañamientos donde soy acompañante
router.get('/mis-aceptaciones', authMiddleware, async (req, res) => {
  try {
    const aceptaciones = await Acompanamiento.find({
      id_acompanante: req.usuaria.id,
      estado: { $in: ['aceptado', 'en_curso'] }
    })
    .populate('id_usuaria', 'nombre_completo foto_perfil ubicacion_actual')
    .sort({ fecha_aceptacion: -1 });
    res.json(aceptaciones);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver detalle
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findById(req.params.id)
      .populate('id_usuaria', 'nombre_completo foto_perfil ubicacion_actual')
      .populate('id_acompanante', 'nombre_completo foto_perfil ubicacion_actual');
    res.json(acompanamiento);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
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
    res.json({ mensaje: 'Aceptado', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});

// Confirmar encuentro (usuaria confirma)
router.put('/confirmar-usuaria/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findById(req.params.id);
    acompanamiento.confirmacion_usuaria = true;
    if (acompanamiento.confirmacion_acompanante) {
      acompanamiento.estado = 'en_curso';
      acompanamiento.fecha_inicio = new Date();
    }
    await acompanamiento.save();
    res.json({ mensaje: 'Confirmado', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});

// Confirmar encuentro (acompañante confirma)
router.put('/confirmar-acompanante/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findById(req.params.id);
    acompanamiento.confirmacion_acompanante = true;
    if (acompanamiento.confirmacion_usuaria) {
      acompanamiento.estado = 'en_curso';
      acompanamiento.fecha_inicio = new Date();
    }
    await acompanamiento.save();
    res.json({ mensaje: 'Confirmado', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});

// Confirmar llegada (usuaria)
router.put('/llegada-usuaria/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findById(req.params.id);
    acompanamiento.llegada_usuaria = true;
    if (acompanamiento.llegada_acompanante) {
      acompanamiento.estado = 'completado';
      acompanamiento.fecha_fin = new Date();
    }
    await acompanamiento.save();
    res.json({ mensaje: 'Llegada confirmada', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});

// Confirmar llegada (acompañante)
router.put('/llegada-acompanante/:id', authMiddleware, async (req, res) => {
  try {
    const acompanamiento = await Acompanamiento.findById(req.params.id);
    acompanamiento.llegada_acompanante = true;
    if (acompanamiento.llegada_usuaria) {
      acompanamiento.estado = 'completado';
      acompanamiento.fecha_fin = new Date();
    }
    await acompanamiento.save();
    res.json({ mensaje: 'Llegada confirmada', acompanamiento });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
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
    res.status(500).json({ mensaje: 'Error' });
  }
});

// Cancelar
router.put('/cancelar/:id', authMiddleware, async (req, res) => {
  try {
    await Acompanamiento.findByIdAndUpdate(req.params.id, { estado: 'cancelado' });
    res.json({ mensaje: 'Cancelado' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});




module.exports = router;