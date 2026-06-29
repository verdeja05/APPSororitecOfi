const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.get('/perfil', authMiddleware, authController.perfil);

module.exports = router;