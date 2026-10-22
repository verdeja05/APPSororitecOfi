const router = require('express').Router();
const Publicacion = require('../models/Publicacion');
const Comentario = require('../models/Comentario');
const Usuaria = require('../models/Usuaria');
const authMiddleware = require('../middleware/auth.middleware');
const notificar = require('../utils/notificar');

router.get('/', async (req, res) => {
  try {
    const publicaciones = await Publicacion.find({ estado: 'activa' })
      .sort({ fecha_publicacion: -1 })
      .limit(20)
      .populate('id_usuaria', 'foto_perfil nombre_completo');
    const resultado = publicaciones.map(post => ({
      ...post.toObject(),
      foto_autor: post.es_anonima ? null : post.id_usuaria?.foto_perfil || null,
      nombre_autor: post.es_anonima ? null : post.nombre_autor || post.id_usuaria?.nombre_completo
    }));
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener publicaciones' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contenido, categoria, es_anonima, imagen_url } = req.body;
    const usuaria = await Usuaria.findById(req.usuaria.id);
    const publicacion = new Publicacion({
      id_usuaria: req.usuaria.id,
      nombre_autor: es_anonima ? null : usuaria.nombre_completo,
      es_anonima: es_anonima || false,
      categoria, contenido, estado: 'activa',
      imagen_url: imagen_url || null
    });
    await publicacion.save();
    res.status(201).json({ mensaje: 'Publicacion creada', publicacion });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear publicacion', error: err.message });
  }
});

router.put('/:id/like', authMiddleware, async (req, res) => {
  try {
    const publicacion = await Publicacion.findById(req.params.id);
    if (!publicacion) return res.status(404).json({ mensaje: 'No encontrada' });
    const yaLiked = publicacion.likes_usuarias.includes(req.usuaria.id);
    if (yaLiked) {
      publicacion.likes_usuarias.pull(req.usuaria.id);
      publicacion.likes = Math.max(0, publicacion.likes - 1);
    } else {
      publicacion.likes_usuarias.push(req.usuaria.id);
      publicacion.likes += 1;

      // Notificar solo al dar like, no al quitar
      if (publicacion.id_usuaria.toString() !== req.usuaria.id && !publicacion.es_anonima) {
        const autor = await Usuaria.findById(req.usuaria.id);
        await notificar(
          publicacion.id_usuaria,
          'like',
          'Le gustó tu publicacion',
          `A ${autor.nombre_completo} le gusto tu publicacion`,
          publicacion._id
        );
      }
    }
    await publicacion.save();
    res.json({ likes: publicacion.likes, liked: !yaLiked });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

router.get('/:id/comentarios', authMiddleware, async (req, res) => {
  try {
    const comentarios = await Comentario.find({ id_publicacion: req.params.id })
      .populate('id_usuaria', 'nombre_completo foto_perfil')
      .sort({ fecha: 1 });
    res.json(comentarios);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

router.post('/:id/comentarios', authMiddleware, async (req, res) => {
  try {
    const { contenido, es_anonimo } = req.body;
    const usuaria = await Usuaria.findById(req.usuaria.id);
    const comentario = new Comentario({
      id_publicacion: req.params.id,
      id_usuaria: req.usuaria.id,
      nombre_autor: es_anonimo ? 'Anonima' : usuaria.nombre_completo,
      foto_autor: es_anonimo ? null : usuaria.foto_perfil,
      es_anonimo: es_anonimo || false,
      contenido
    });
    await comentario.save();
    const publicacion = await Publicacion.findByIdAndUpdate(
      req.params.id,
      { $inc: { num_comentarios: 1 } },
      { new: true }
    );

    // Notificar al autor si no es el mismo que comenta
    if (publicacion.id_usuaria.toString() !== req.usuaria.id && !publicacion.es_anonima) {
      await notificar(
        publicacion.id_usuaria,
        'comentario',
        'Nuevo comentario',
        `${es_anonimo ? 'Alguien' : usuaria.nombre_completo} comento tu publicacion`,
        publicacion._id
      );
    }

    res.status(201).json({ mensaje: 'Comentario agregado', comentario });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;