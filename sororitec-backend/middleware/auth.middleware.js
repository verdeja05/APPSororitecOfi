// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        mensaje: "Acceso denegado. No se proporcionó token",
      });
    }

    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({
        mensaje: "Formato de token inválido. Usa: Bearer <token>",
      });
    }

    const token = tokenParts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select("-contrasena");

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Usuario no encontrado",
      });
    }

    if (usuario.estado !== "activo") {
      return res.status(401).json({
        mensaje: "Cuenta inactiva. Contacta al administrador",
      });
    }

    req.usuario = usuario;
    req.usuarioId = usuario._id;
    next(); // ✅ Asegura que next se llama correctamente
  } catch (error) {
    console.error("❌ Error en autenticación:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        mensaje: "Token inválido",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        mensaje: "Token expirado. Inicia sesión nuevamente",
      });
    }

    return res.status(500).json({
      mensaje: "Error en el servidor",
      error: error.message,
    });
  }
};

// ✅ EXPORTACIÓN DIRECTA
module.exports = authMiddleware;
