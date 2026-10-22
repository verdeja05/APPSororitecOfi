const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema({
  id_usuaria: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', required: true },
  nombre_usuaria: { type: String },
  tipo: { 
    type: String, 
    enum: ['legal', 'medica', 'psicologica'], 
    required: true 
  },
  asunto: { type: String, required: true },
  descripcion: { type: String, required: true },
  estado: { 
    type: String, 
    enum: ['pendiente', 'en_revision', 'respondida', 'cerrada'], 
    default: 'pendiente' 
  },
  respuesta: { type: String, default: null },
  id_especialista: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria', default: null },
  nombre_especialista: { type: String, default: null },
  fecha_consulta: { type: Date, default: Date.now },
  fecha_respuesta: { type: Date, default: null },
  chat_activo: { type: Boolean, default: false },
  mensajes: [{
    id_autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria' },
    nombre_autor: { type: String },
    rol_autor: { type: String },
    mensaje: { type: String },
    fecha: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Consulta', consultaSchema, 'consultas');