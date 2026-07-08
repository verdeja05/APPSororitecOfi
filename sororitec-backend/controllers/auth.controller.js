const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// REGISTRO - CON USUARIO ACTIVO
// ==========================================
exports.registro = async (req, res) => {
  try {
    const { nombre_completo, correo_institucional, contrasena, carrera, cuatrimestre } = req.body;

    // Validar campos requeridos
    if (!nombre_completo || !correo_institucional || !contrasena) {
      return res.status(400).json({ 
        mensaje: 'Faltan campos requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    const existe = await Usuario.findOne({ correo_institucional });
    if (existe) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // Crear usuario - VERIFICADO Y ACTIVO
    const nuevaUsuaria = new Usuario({
      nombre_completo,
      correo_institucional,
      contrasena: hashedPassword,
      carrera: carrera || '',
      cuatrimestre: cuatrimestre || 1,
      verificado: true,
      estado: 'activo',
      fecha_registro: new Date(),
      fecha_validacion: new Date()
    });

    await nuevaUsuaria.save();

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: nuevaUsuaria._id, 
        correo: nuevaUsuaria.correo_institucional 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      mensaje: 'Registro exitoso',
      token,
      usuaria: {
        id: nuevaUsuaria._id,
        nombre: nuevaUsuaria.nombre_completo,
        correo: nuevaUsuaria.correo_institucional,
        carrera: nuevaUsuaria.carrera,
        cuatrimestre: nuevaUsuaria.cuatrimestre
      }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ 
      mensaje: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// ==========================================
// LOGIN
// ==========================================
exports.login = async (req, res) => {
  try {
    const { correo_institucional, contrasena } = req.body;

    if (!correo_institucional || !contrasena) {
      return res.status(400).json({ 
        mensaje: 'Correo y contraseña son requeridos' 
      });
    }

    const usuaria = await Usuario.findOne({ correo_institucional });
    if (!usuaria) {
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    }

    // Verificar que esté activo
    if (usuaria.estado !== 'activo' || !usuaria.verificado) {
      return res.status(400).json({ 
        mensaje: 'Tu cuenta aún no ha sido validada' 
      });
    }

    const esValida = await bcrypt.compare(contrasena, usuaria.contrasena);
    if (!esValida) {
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuaria._id, correo: usuaria.correo_institucional },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      usuaria: {
        id: usuaria._id,
        nombre: usuaria.nombre_completo,
        correo: usuaria.correo_institucional,
        carrera: usuaria.carrera,
        cuatrimestre: usuaria.cuatrimestre
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      mensaje: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// ==========================================
// PERFIL
// ==========================================
exports.perfil = async (req, res) => {
  try {
    const usuaria = await Usuario.findById(req.usuario.id).select('-contrasena');
    if (!usuaria) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuaria);
  } catch (error) {
    console.error('❌ Error en perfil:', error);
    res.status(500).json({ 
      mensaje: 'Error en el servidor', 
      error: error.message 
    });
  }
};
