const mongoose = require('mongoose');

const inscripcionSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['taller', 'beca'], required: true },
  id_referencia: { type: mongoose.Schema.Types.ObjectId, required: true },
  titulo_referencia: { type: String },
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  nombre_completo: { type: String, required: true },
  correo_institucional: { type: String, required: true },
  telefono: { type: String, required: true },
  carrera: { type: String, required: true },
  cuatrimestre: { type: String, required: true },
  motivacion: { type: String, required: true },
  experiencia_previa: { type: String, default: '' },
  estado: { 
    type: String, 
    enum: ['pendiente', 'confirmada', 'rechazada', 'cancelada'], 
    default: 'pendiente' 
  },
  fecha_inscripcion: { type: Date, default: Date.now },
  fecha_confirmacion: { type: Date, default: null },
  notas_admin: { type: String, default: '' },
});

module.exports = mongoose.model('Inscripcion', inscripcionSchema, 'inscripciones');