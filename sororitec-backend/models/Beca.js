const mongoose = require('mongoose');

const becaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  institucion: { type: String, required: true },
  descripcion: { type: String, required: true },
  tipo: { 
    type: String, 
    enum: ['academica', 'deportiva', 'cultural', 'investigacion', 'movilidad', 'otro'],
    required: true 
  },
  monto: { type: String, default: null },
  cubre: { type: String, default: '' },
  requisitos: { type: String, required: true },
  documentos_necesarios: { type: String, default: '' },
  fecha_limite: { type: Date, required: true },
  fecha_publicacion: { type: Date, default: Date.now },
  enlace_oficial: { type: String, default: null },
  imagen_url: { type: String, default: null },
  estado: { type: String, enum: ['activa', 'inactiva', 'cerrada'], default: 'activa' },
  id_administrador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuaria' },
});

module.exports = mongoose.model('Beca', becaSchema, 'becas');