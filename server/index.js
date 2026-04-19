import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import billingRoutes from './routes/billing.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import { errorHandler } from './middleware/errorHandler.js';
import { autoMigrate, checkDatabaseConnection } from './utils/autoMigrate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Para usar __dirname con ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS dinámico e inteligente
const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // En desarrollo: permitir cualquier localhost:* y IPs de red local
    if (isDevelopment) {
      const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      const localNetworkPattern = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/;
      const localNetworkPattern2 = /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/;
      const localNetworkPattern3 = /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/;
      
      if (localhostPattern.test(origin) || 
          localNetworkPattern.test(origin) || 
          localNetworkPattern2.test(origin) ||
          localNetworkPattern3.test(origin)) {
        return callback(null, true);
      }
    }
    
    // En producción: verificar lista específica del .env
    const corsOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];
    
    // Si CORS_ORIGIN contiene '*', permitir todos
    if (corsOrigins.includes('*')) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Si llegamos aquí en producción, denegar
    if (!isDevelopment) {
      console.warn(`⚠️  CORS bloqueó origen: ${origin}`);
      return callback(new Error('No permitido por CORS'));
    }
    
    // En desarrollo, permitir por defecto
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '0.7.1' });
});

// ============================================================================
// SERVIR FRONTEND EN PRODUCCIÓN
// ============================================================================
// En producción, el backend sirve los archivos estáticos del frontend
// Esto permite tener un solo servicio en Render/Railway/etc.
if (!isDevelopment) {
  const distPath = path.join(__dirname, '../dist');
  
  console.log(`📦 Sirviendo frontend desde: ${distPath}`);
  
  // Servir archivos estáticos
  app.use(express.static(distPath));
  
  // Catch-all: devolver index.html para rutas del frontend (SPA)
  // Esto debe estar DESPUÉS de las rutas /api
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handler (debe ser el último middleware)
app.use(errorHandler);

/**
 * Obtiene la IP local del servidor
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Buscar IPv4 no interna
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Inicializa el servidor y la base de datos
 */
async function startServer() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           🎮 D4BUILDS - SERVIDOR BACKEND v0.7.1           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Verificar conexión a BD
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error('\n❌ No se pudo conectar a la base de datos. Abortando inicio...\n');
    process.exit(1);
  }
  
  // Auto-migración si está habilitada
  if (process.env.AUTO_MIGRATE === 'true') {
    const migrated = await autoMigrate();
    if (!migrated) {
      console.warn('\n⚠️  Advertencia: Migraciones fallaron pero el servidor continuará...\n');
    }
  } else {
    console.log('ℹ️  Auto-migración deshabilitada (AUTO_MIGRATE=false)\n');
  }
  
  // Iniciar servidor HTTP
  app.listen(PORT, () => {
    const localIP = getLocalIP();
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 ✅ SERVIDOR INICIADO                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`🌐 URLs de acceso:`);
    console.log(`   • Local:    http://localhost:${PORT}`);
    console.log(`   • Red:      http://${localIP}:${PORT}`);
    console.log(`   • API:      http://localhost:${PORT}/api`);
    console.log(`   • Health:   http://localhost:${PORT}/health\n`);
    console.log(`📊 Configuración:`);
    console.log(`   • Base de datos: ${process.env.DB_NAME}`);
    console.log(`   • JWT: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`   • CORS: ${isDevelopment ? '🔓 Modo desarrollo (acepta localhost:* e IPs locales)' : `🔒 ${process.env.CORS_ORIGIN || 'Sin configurar'}`}`);
    console.log(`   • Entorno: ${process.env.NODE_ENV || 'development'}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}

// Iniciar el servidor
startServer().catch(error => {
  console.error('\n❌ Error fatal al iniciar servidor:', error);
  process.exit(1);
});

export default app;
