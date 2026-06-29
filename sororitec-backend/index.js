const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/publicaciones', require('./routes/publicaciones.routes'));
app.use('/api/acompanamientos', require('./routes/acompanamientos.routes'));app.use('/api/perfil', require('./routes/perfil.routes'));
app.use('/api/historias', require('./routes/historias.routes'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));