const router = require('express').Router();
const Usuaria = require('../models/Usuaria');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware para verificar superadmin
const soloSuperadmin = async (req, res, next) => {
  const usuaria = await Usuaria.findById(req.usuaria.id);
  if (usuaria?.rol !== 'superadmin') {
    return res.status(403).json({ mensaje: 'Acceso denegado' });
  }
  next();
};

// Ver todas las usuarias
router.get('/usuarias', authMiddleware, soloSuperadmin, async (req, res) => {
  try {
    const usuarias = await Usuaria.find()
      .select('-contrasena_hash')
      .sort({ fecha_registro: -1 });
    res.json(usuarias);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Crear cuenta especialista
router.post('/crear-cuenta', authMiddleware, soloSuperadmin, async (req, res) => {
  try {
    const { nombre_completo, correo_institucional, contrasena, rol } = req.body;

    const rolesPermitidos = ['usuaria', 'abogada', 'psicologa', 'medica', 'administradora', 'acompanante'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ mensaje: 'Rol no permitido' });
    }

    const existe = await Usuaria.findOne({ correo_institucional });
    if (existe) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const contrasena_hash = await bcrypt.hash(contrasena, salt);

    const nueva = new Usuaria({
      nombre_completo,
      correo_institucional,
      contrasena_hash,
      rol,
      estado_cuenta: 'activa',
    });

    await nueva.save();
    res.status(201).json({ 
      mensaje: 'Cuenta creada exitosamente',
      usuaria: { id: nueva._id, nombre_completo, correo_institucional, rol }
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Cambiar rol
router.put('/cambiar-rol/:id', authMiddleware, soloSuperadmin, async (req, res) => {
  try {
    const { rol } = req.body;
    const usuaria = await Usuaria.findByIdAndUpdate(
      req.params.id,
      { rol },
      { new: true }
    ).select('-contrasena_hash');
    res.json({ mensaje: 'Rol actualizado', usuaria });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Suspender/activar cuenta
router.put('/estado/:id', authMiddleware, soloSuperadmin, async (req, res) => {
  try {
    const { estado_cuenta } = req.body;
    const usuaria = await Usuaria.findByIdAndUpdate(
      req.params.id,
      { estado_cuenta },
      { new: true }
    ).select('-contrasena_hash');
    res.json({ mensaje: 'Estado actualizado', usuaria });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Estadísticas generales
router.get('/estadisticas', authMiddleware, soloSuperadmin, async (req, res) => {
  try {
    const Consulta = require('../models/Consulta');
    const Publicacion = require('../models/Publicacion');
    const Acompanamiento = require('../models/Acompanamiento');

    const [
      totalUsuarias,
      usuariasPorRol,
      totalConsultas,
      consultasPendientes,
      totalPublicaciones,
      totalAcompanamientos,
    ] = await Promise.all([
      Usuaria.countDocuments(),
      Usuaria.aggregate([{ $group: { _id: '$rol', total: { $sum: 1 } } }]),
      Consulta.countDocuments(),
      Consulta.countDocuments({ estado: 'pendiente' }),
      Publicacion.countDocuments(),
      Acompanamiento.countDocuments(),
    ]);

    res.json({
      totalUsuarias,
      usuariasPorRol,
      totalConsultas,
      consultasPendientes,
      totalPublicaciones,
      totalAcompanamientos,
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

// Datos para gráficas
router.get('/graficas', authMiddleware, soloSuperadmin, async (req, res) => {
  try {
    const Consulta = require('../models/Consulta');
    const Publicacion = require('../models/Publicacion');

    const ahora = new Date();
    const hace6Meses = new Date();
    hace6Meses.setMonth(hace6Meses.getMonth() - 6);

    // Usuarias registradas por mes (últimos 6 meses)
    const usuariasPorMes = await Usuaria.aggregate([
      { $match: { fecha_registro: { $gte: hace6Meses } } },
      {
        $group: {
          _id: {
            mes: { $month: '$fecha_registro' },
            anio: { $year: '$fecha_registro' }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { '_id.anio': 1, '_id.mes': 1 } }
    ]);

    // Consultas por tipo
    const consultasPorTipo = await Consulta.aggregate([
      { $group: { _id: '$tipo', total: { $sum: 1 } } }
    ]);

    // Consultas por estado
    const consultasPorEstado = await Consulta.aggregate([
      { $group: { _id: '$estado', total: { $sum: 1 } } }
    ]);

    // Consultas por mes
    const consultasPorMes = await Consulta.aggregate([
      { $match: { fecha_consulta: { $gte: hace6Meses } } },
      {
        $group: {
          _id: {
            mes: { $month: '$fecha_consulta' },
            anio: { $year: '$fecha_consulta' }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { '_id.anio': 1, '_id.mes': 1 } }
    ]);

    // Usuarias por rol
    const usuariasPorRol = await Usuaria.aggregate([
      { $group: { _id: '$rol', total: { $sum: 1 } } }
    ]);

    // Acompañamientos por estado
    const Acompanamiento = require('../models/Acompanamiento');
    const acompanamientosPorEstado = await Acompanamiento.aggregate([
      { $group: { _id: '$estado', total: { $sum: 1 } } }
    ]);

    res.json({
      usuariasPorMes,
      consultasPorTipo,
      consultasPorEstado,
      consultasPorMes,
      usuariasPorRol,
      acompanamientosPorEstado,
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message });
  }
});

module.exports = router;