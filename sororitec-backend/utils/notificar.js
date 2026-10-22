const Notificacion = require('../models/Notificacion');

const notificar = async (id_usuaria, tipo, titulo, mensaje, id_referencia = null) => {
  try {
    await Notificacion.create({ id_usuaria, tipo, titulo, mensaje, id_referencia });
  } catch (err) {
    console.log('Error al crear notificacion:', err.message);
  }
};

module.exports = notificar;