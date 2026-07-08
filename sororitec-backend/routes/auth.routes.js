// routes/auth.routes.js
const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Rutas públicas
router.post("/registro", authController.registro);
router.post("/login", authController.login);

// Ruta protegida (requiere autenticación)
router.get("/perfil", authMiddleware, authController.perfil);

module.exports = router;
