require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');

const { setupWebSocket } = require('./websocket');

const authRoutes   = require('./routes/auth.routes');
const userRoutes   = require('./routes/user.routes');
const friendRoutes = require('./routes/friend.routes');
const chatRoutes   = require('./routes/chat.routes');
const uploadRoutes = require('./routes/upload.routes');

const app    = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ status: 'OK', app: 'FriendZone API' }));

app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chats',   chatRoutes);
app.use('/api/upload',  uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});