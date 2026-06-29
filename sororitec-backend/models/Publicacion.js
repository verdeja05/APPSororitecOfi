const mongoose = require('mongoose');

const publicacionSchema = new mongoose.Schema({
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria' },
  nombre_autor: { type: String, default: null },
  es_anonima: { type: Boolean, default: false },
  categoria: { type: String },
  contenido: { type: String, required: true },
  estado: { type: String, default: 'activa' },
  likes: { type: Number, default: 0 },
  num_comentarios: { type: Number, default: 0 },
  likes_usuarias: [{ type: mongoose.Schema.Types.ObjectId }],
  fecha_publicacion: { type: Date, default: Date.now },
  imagen_url: { type: String, default: null },
});

module.exports = mongoose.model('Publicacion', publicacionSchema, 'publicaciones');