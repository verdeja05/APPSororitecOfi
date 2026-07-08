// models/Usuario.js - VERSIÓN DEFINITIVA SIN PRE-SAVE
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    nombre_completo: {
      type: String,
      required: true,
      trim: true,
    },
    correo_institucional: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    contrasena: {
      type: String,
      required: true,
    },
    carrera: {
      type: String,
      default: "",
    },
    cuatrimestre: {
      type: Number,
      default: 1,
    },
    rol: {
      type: String,
      enum: ["admin", "usuario", "acompanante"],
      default: "usuario",
    },
    verificado: {
      type: Boolean,
      default: true,
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo", "suspendido"],
      default: "activo",
    },
    fecha_registro: {
      type: Date,
      default: Date.now,
    },
    fecha_validacion: {
      type: Date,
      default: Date.now,
    },
    bio: {
      type: String,
      default: "",
    },
    telefono: {
      type: String,
      default: "",
    },
    foto_perfil: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ✅ NO HAY pre-save AQUÍ

const Usuario = mongoose.model("Usuario", usuarioSchema);

module.exports = Usuario;
