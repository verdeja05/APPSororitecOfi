const router = require('express').Router();
const Consulta = require('../models/Consulta');
const Usuaria = require('../models/Usuaria');
const authMiddleware = require('../middleware/auth.middleware');
const notificar = require('../utils/notificar');

// Crear consulta (usuaria)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tipo, asunto, descripcion } = req.body;
    const usuaria = await Usuaria.findById(req.usuaria.id);
    const consulta = new Consulta({
      id_usuaria: req.usuaria.id,
      nombre_usuaria: usuaria.nombre_completo,
      tipo, asunto, descripcion
    });
    await consulta.save();
    res.status(201).json({ mensaje: 'Consulta enviada', consulta });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver mis consultas (usuaria)
router.get('/mis-consultas', authMiddleware, async (req, res) => {
  try {
    const consultas = await Consulta.find({ id_usuaria: req.usuaria.id })
      .sort({ fecha_consulta: -1 });
    res.json(consultas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver consultas por tipo (especialista)
router.get('/tipo/:tipo', authMiddleware, async (req, res) => {
  try {
    const consultas = await Consulta.find({ tipo: req.params.tipo })
      .populate('id_usuaria', 'nombre_completo foto_perfil')
      .sort({ fecha_consulta: -1 });
    res.json(consultas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Ver detalle de consulta
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const consulta = await Consulta.findById(req.params.id)
      .populate('id_usuaria', 'nombre_completo foto_perfil')
      .populate('id_especialista', 'nombre_completo');
    res.json(consulta);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Responder consulta (especialista)
router.put('/responder/:id', authMiddleware, async (req, res) => {
  try {
    const { respuesta } = req.body;
    const especialista = await Usuaria.findById(req.usuaria.id);
    const consulta = await Consulta.findByIdAndUpdate(
      req.params.id,
      {
        respuesta,
        estado: 'respondida',
        id_especialista: req.usuaria.id,
        nombre_especialista: especialista.nombre_completo,
        fecha_respuesta: new Date(),
        chat_activo: true
      },
      { new: true }
    );

    // Notificar a la usuaria
    await notificar(
      consulta.id_usuaria,
      'consulta_respondida',
      'Respuesta a tu consulta',
      `Tu consulta "${consulta.asunto}" ha sido respondida por ${especialista.nombre_completo}`,
      consulta._id
    );

    res.json({ mensaje: 'Respuesta enviada', consulta });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Enviar mensaje en chat
router.post('/chat/:id', authMiddleware, async (req, res) => {
  try {
    const { mensaje } = req.body;
    const autor = await Usuaria.findById(req.usuaria.id);
    const consulta = await Consulta.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          mensajes: {
            id_autor: req.usuaria.id,
            nombre_autor: autor.nombre_completo,
            rol_autor: autor.rol,
            mensaje,
            fecha: new Date()
          }
        },
        estado: 'en_revision'
      },
      { new: true }
    );

    // Notificar al otro participante
    const idDestinatario = autor._id.toString() === consulta.id_usuaria.toString()
      ? consulta.id_especialista
      : consulta.id_usuaria;

    if (idDestinatario) {
      await notificar(
        idDestinatario,
        'comentario',
        'Nuevo mensaje en tu consulta',
        `${autor.nombre_completo} te envio un mensaje en "${consulta.asunto}"`,
        consulta._id
      );
    }

    res.json({ mensaje: 'Mensaje enviado', consulta });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Cerrar consulta
router.put('/cerrar/:id', authMiddleware, async (req, res) => {
  try {
    const consulta = await Consulta.findByIdAndUpdate(
      req.params.id,
      { estado: 'cerrada', chat_activo: false },
      { new: true }
    );
    res.json({ mensaje: 'Consulta cerrada', consulta });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;