const mongoose = require('mongoose');

const historiaSchema = new mongoose.Schema({
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  nombre_autor: { type: String, default: '' },
  foto_autor: { type: String, default: null },
  tipo: { type: String, enum: ['texto', 'imagen'], default: 'texto' },
  contenido: { type: String, default: '' },
  imagen_url: { type: String, default: null },
  color_fondo: { type: String, default: '#7C3AED' },
  fecha_creacion: { type: Date, default: Date.now },
  expira_en: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  vistas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria' }],
});

module.exports = mongoose.model('Historia', historiaSchema, 'historias');