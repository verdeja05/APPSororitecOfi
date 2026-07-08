// sororitec-backend/index.js
// ==========================================
// CARGA DE ENTORNO
// ==========================================
const path = require("path");
const fs = require("fs");

function loadEnv() {
  const envPath = path.resolve(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    console.error("❌ No existe el archivo .env");
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  let loaded = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const firstEqual = trimmed.indexOf("=");
      if (firstEqual > 0) {
        const key = trimmed.substring(0, firstEqual).trim();
        const value = trimmed.substring(firstEqual + 1).trim();
        process.env[key] = value;
        loaded++;
        console.log(`✅ Cargada: ${key}`);
      }
    }
  });

  console.log(`📦 Total: ${loaded} variables cargadas\n`);
}

loadEnv();

if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI no está definida");
  process.exit(1);
}

console.log("🔗 Conectando a MongoDB Atlas...");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ==========================================
// CONFIGURACIÓN CORS
// ==========================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
  }),
);

// ==========================================
// MIDDLEWARE DE APLICACIÓN
// ==========================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ==========================================
// RUTAS DE PRUEBA
// ==========================================
app.get("/", (req, res) => {
  res.json({
    mensaje: "🚀 Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    rutas: [
      "GET  /",
      "GET  /test",
      "POST /api/auth/registro",
      "POST /api/auth/login",
      "GET  /api/auth/perfil",
    ],
  });
});

app.get("/test", (req, res) => {
  res.json({
    mensaje: "✅ Test exitoso",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// RUTAS DE LA API
// ==========================================
console.log("📌 Montando rutas...");

try {
  app.use("/api/auth", require("./routes/auth.routes"));
  console.log("✅ /api/auth montada");
} catch (error) {
  console.error("❌ Error montando /api/auth:", error.message);
}

// ==========================================
// CONEXIÓN MONGODB
// ==========================================
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
};

console.log("⏳ Intentando conectar a MongoDB...");

mongoose
  .connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log("✅ MongoDB Atlas conectado exitosamente");
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err.message);
    console.log("⚠️  El servidor seguirá funcionando sin base de datos");
  });

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n========================================`);
  console.log(`🚀 SERVIDOR ACTIVO`);
  console.log(`========================================`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`📱 Red: http://192.168.100.123:${PORT}`);
  console.log(`\n📋 ENDPOINTS DISPONIBLES:`);
  console.log(`   ✅ GET  /                    - Estado del servidor`);
  console.log(`   ✅ GET  /test                - Test de conexión`);
  console.log(`   ✅ POST /api/auth/registro   - Registrar usuario`);
  console.log(`   ✅ POST /api/auth/login      - Iniciar sesión`);
  console.log(`   ✅ GET  /api/auth/perfil     - Ver perfil (requiere token)`);
  console.log(`========================================\n`);
});

// ==========================================
// MANEJO DE ERRORES
// ==========================================
process.on("uncaughtException", (err) => {
  console.error("❌ Error no capturado:", err.message);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promesa rechazada:", reason);
});
