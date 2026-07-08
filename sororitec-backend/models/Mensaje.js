const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  id_acompanamiento: { type: mongoose.Schema.Types.ObjectId, ref: 'Acompanamiento', required: true },
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  nombre: { type: String, required: true },
  texto: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensaje', mensajeSchema, 'mensajes_acompanamiento');