const mongoose = require('mongoose');

const tallerSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  categoria: {
    type: String,
    enum: ['tecnologia', 'salud', 'legal', 'bienestar', 'liderazgo', 'emprendimiento', 'otro'],
    required: true
  },
  instructor: { type: String, required: true },
  fecha_inicio: { type: Date, required: true },
  fecha_fin: { type: Date, default: null },
  horario: { type: String, required: true },
  lugar: { type: String, required: true },
  modalidad: { type: String, enum: ['presencial', 'virtual', 'hibrido'], default: 'presencial' },
  enlace_virtual: { type: String, default: null },
  cupo_maximo: { type: Number, required: true },
  cupo_disponible: { type: Number, default: 0 },
  imagen_url: { type: String, default: null },
  requisitos: { type: String, default: '' },
  estado: { type: String, enum: ['activo', 'inactivo', 'finalizado'], default: 'activo' },
  id_administrador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria' },
  fecha_publicacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Taller', tallerSchema, 'talleres');