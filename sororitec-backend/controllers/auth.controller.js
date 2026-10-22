const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuaria = require('../models/Usuaria');

exports.registro = async (req, res) => {
  try {
    const { nombre_completo, correo_institucional, contrasena, carrera, cuatrimestre } = req.body;

    const existe = await Usuaria.findOne({ correo_institucional });
    if (existe) return res.status(400).json({ mensaje: 'Correo ya registrado' });

    const salt = await bcrypt.genSalt(10);
    const contrasena_hash = await bcrypt.hash(contrasena, salt);

    const usuaria = new Usuaria({
      nombre_completo,
      correo_institucional,
      contrasena_hash,
      carrera,
      cuatrimestre
    });

    await usuaria.save();
    res.status(201).json({ mensaje: 'Registro exitoso, pendiente de validación' });
  } catch (err) {
    console.log('ERROR REGISTRO:', err);
    res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { correo_institucional, contrasena } = req.body;

    const usuaria = await Usuaria.findOne({ correo_institucional });
    if (!usuaria) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

    if (usuaria.estado_cuenta === 'pendiente')
      return res.status(403).json({ mensaje: 'Tu cuenta está pendiente de validación' });

    if (usuaria.estado_cuenta !== 'activa')
      return res.status(403).json({ mensaje: 'Tu cuenta no está activa' });

    const valida = await bcrypt.compare(contrasena, usuaria.contrasena_hash);
    if (!valida) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

    usuaria.ultimo_acceso = new Date();
    await usuaria.save();

    const token = jwt.sign(
      { id: usuaria._id, estado: usuaria.estado_cuenta },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      token,
      usuaria: {
        _id: usuaria._id,
        nombre_completo: usuaria.nombre_completo,
        correo_institucional: usuaria.correo_institucional,
        carrera: usuaria.carrera,
        cuatrimestre: usuaria.cuatrimestre,
        foto_perfil: usuaria.foto_perfil,
        rol: usuaria.rol,
        estado_cuenta: usuaria.estado_cuenta,
      }
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
  }
};

exports.perfil = async (req, res) => {
  try {
    const usuaria = await Usuaria.findById(req.usuaria.id).select('-contrasena_hash');
    res.json(usuaria);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};