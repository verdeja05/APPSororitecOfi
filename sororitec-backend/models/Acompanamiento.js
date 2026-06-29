const mongoose = require('mongoose');

const acompanamientoSchema = new mongoose.Schema({
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  id_acompanante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', default: null },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'en_curso', 'completado', 'cancelado'],
    default: 'pendiente'
  },
  ubicacion_usuaria: {
    latitud: { type: Number },
    longitud: { type: Number }
  },
  ubicacion_acompanante: {
    latitud: { type: Number },
    longitud: { type: Number }
  },
  descripcion: { type: String, default: '' },
  fecha_solicitud: { type: Date, default: Date.now },
  fecha_aceptacion: { type: Date, default: null },
  fecha_inicio: { type: Date, default: null },
  fecha_fin: { type: Date, default: null },
  nombre_acompanante: { type: String, default: null },
  nombre_usuaria: { type: String, default: null },
});

module.exports = mongoose.model('Acompanamiento', acompanamientoSchema, 'acompanamientos');