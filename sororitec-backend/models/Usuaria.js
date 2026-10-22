const mongoose = require('mongoose');

const usuariaSchema = new mongoose.Schema({
  nombre_completo: { type: String, required: true },
  correo_institucional: { type: String, required: true, unique: true },
  contrasena_hash: { type: String, required: true },
  telefono: { type: String, default: '' },
  carrera: { type: String, default: '' },
  cuatrimestre: { type: Number, default: null },
  foto_perfil: { type: String, default: null },
  bio: { type: String, default: '' },
  rol: { 
  type: String, 
  enum: ['usuaria', 'administradora', 'acompanante', 'abogada', 'psicologa', 'medica', 'superadmin'], 
  default: 'usuaria' 
},
  estado_cuenta: {
    type: String,
    enum: ['pendiente', 'activa', 'suspendida', 'baneada'],
    default: 'pendiente'
  },
  fecha_registro: { type: Date, default: Date.now },
  ultimo_acceso: { type: Date, default: null },
  disponible_acompanante: { type: Boolean, default: false },
  ubicacion_actual: {
    latitud: { type: Number, default: null },
    longitud: { type: Number, default: null },
    actualizado: { type: Date, default: null }
  },
});

module.exports = mongoose.model('Usuaria', usuariaSchema);