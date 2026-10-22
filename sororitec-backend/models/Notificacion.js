const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  tipo: {
    type: String,
    enum: [
      'consulta_respondida',
      'taller_confirmado',
      'comentario',
      'acompanamiento_aceptado',
      'like',
      'alerta_panico'
    ],
    required: true
  },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  leida: { type: Boolean, default: false },
  id_referencia: { type: mongoose.Schema.Types.ObjectId, default: null },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notificacion', notificacionSchema, 'notificaciones');