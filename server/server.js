const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { initializeSocket } = require('./socket/gameSocket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rutas básicas
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'El Secreto de Kirchner - Server running' });
});

// Inicializar Socket.IO
initializeSocket(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🎮 El Secreto de Kirchner - Servidor corriendo en puerto ${PORT}`);
});

module.exports = { app, server, io };

