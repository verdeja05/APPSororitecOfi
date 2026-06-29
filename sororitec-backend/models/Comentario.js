const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
  id_publicacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Publicacion', required: true },
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  nombre_autor: { type: String, default: 'Usuaria' },
  foto_autor: { type: String, default: null },
  es_anonimo: { type: Boolean, default: false },
  contenido: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comentario', comentarioSchema, 'comentarios');