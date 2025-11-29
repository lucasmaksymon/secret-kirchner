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

server.listen(config.port, '0.0.0.0', () => {
  logger.info(`El Secreto de Kirchner - Servidor corriendo en puerto ${config.port}`);
  logger.info(`Entorno: ${config.nodeEnv}`);
  logger.info(`Cliente permitido: ${config.corsOrigin}`);
});

module.exports = { app, server, io };

