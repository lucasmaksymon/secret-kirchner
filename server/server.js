const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { initializeSocket } = require('./socket/gameSocket');
const { getConfig } = require('./config/environment');
const { createLogger } = require('./utils/logger');

const logger = createLogger('Server');

const app = express();
const config = getConfig();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  methods: ["GET", "POST"]
}));
app.use(express.json());
app.use(express.static('public'));

// Rutas básicas
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'El Secreto de Kirchner - Server running',
    environment: config.nodeEnv,
    port: config.port
  });
});

// Inicializar Socket.IO
initializeSocket(io);

// Asegurar que el puerto sea un número
const port = parseInt(config.port, 10) || 3000;

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado en puerto ${port}`);
  logger.info(`El Secreto de Kirchner - Servidor corriendo en puerto ${port}`);
  logger.info(`Entorno: ${config.nodeEnv}`);
  logger.info(`Cliente permitido: ${config.corsOrigin}`);
  logger.info(`Escuchando en: 0.0.0.0:${port}`);
});

// Manejar errores de inicio
server.on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  logger.error('Error al iniciar el servidor:', error);
  process.exit(1);
});

module.exports = { app, server, io };

