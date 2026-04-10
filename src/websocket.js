const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });
const clients = new Map();

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    const url   = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) { ws.close(1008, 'Token requerido'); return; }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      ws.close(1008, 'Token inválido');
      return;
    }

    clients.set(userId, ws);
    ws.send(JSON.stringify({ type: 'CONNECTED', userId }));

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.type === 'SEND_MESSAGE') {
          const { chatId, receiverId, content, imageUrl, messageType } = data;

          const message = await prisma.message.create({
            data: {
              chatId:   parseInt(chatId),
              senderId: userId,
              content:  content  || null,
              imageUrl: imageUrl || null,
              type:     messageType || 'TEXT',
            },
            include: {
              sender: { select: { id: true, name: true, avatar: true } }
            }
          });

          const payload = JSON.stringify({ type: 'NEW_MESSAGE', message });
          ws.send(payload);

          const receiverWs = clients.get(parseInt(receiverId));
          if (receiverWs?.readyState === 1) receiverWs.send(payload);
        }

        if (data.type === 'TYPING') {
          const receiverWs = clients.get(parseInt(data.receiverId));
          if (receiverWs?.readyState === 1) {
            receiverWs.send(JSON.stringify({ type: 'TYPING', userId, chatId: data.chatId }));
          }
        }

      } catch (err) {
        console.error('WS error:', err.message);
      }
    });

    ws.on('close', () => {
      clients.delete(userId);
    });
  });
}

module.exports = { setupWebSocket };