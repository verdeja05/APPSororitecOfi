const mongoose = require('mongoose');

const acompanamientoSchema = new mongoose.Schema({
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  id_acompanante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', default: null },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'en_curso', 'completado', 'cancelado'],
    default: 'pendiente'
  },
  ubicacion_usuaria: { latitud: Number, longitud: Number },
  ubicacion_acompanante: { latitud: Number, longitud: Number },
  descripcion: { type: String, default: '' },
  situacion_tipo: { type: String, default: '' },
  destino: { type: String, default: '' },
  fecha_solicitud: { type: Date, default: Date.now },
  fecha_aceptacion: { type: Date, default: null },
  fecha_inicio: { type: Date, default: null },
  fecha_fin: { type: Date, default: null },
  nombre_acompanante: { type: String, default: null },
  nombre_usuaria: { type: String, default: null },
  confirmacion_usuaria: { type: Boolean, default: false },
  confirmacion_acompanante: { type: Boolean, default: false },
  llegada_usuaria: { type: Boolean, default: false },
  llegada_acompanante: { type: Boolean, default: false },
  calificacion_a_acompanante: { type: Number, default: null, min: 1, max: 5 },
  calificacion_a_usuaria: { type: Number, default: null, min: 1, max: 5 },
  resena_a_acompanante: { type: String, default: '' },
  resena_a_usuaria: { type: String, default: '' },
  reporte_enviado: { type: Boolean, default: false },
});

module.exports = mongoose.model('Acompanamiento', acompanamientoSchema, 'acompanamientos');