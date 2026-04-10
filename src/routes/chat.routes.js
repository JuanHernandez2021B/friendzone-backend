const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { authenticate } = require('../middleware/auth.middleware');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

router.get('/', authenticate, async (req, res) => {
  try {
    const myId = req.user.id;
    const chats = await prisma.chat.findMany({
      where: { OR: [{ userAId: myId }, { userBId: myId }] },
      include: {
        userA: { select: { id:true, name:true, avatar:true } },
        userB: { select: { id:true, name:true, avatar:true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = chats.map(c => ({
      id:          c.id,
      other:       c.userAId === myId ? c.userB : c.userA,
      lastMessage: c.messages[0] || null,
      createdAt:   c.createdAt,
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const myId   = req.user.id;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, OR: [{ userAId: myId }, { userBId: myId }] }
    });
    if (!chat) return res.status(403).json({ error: 'No tienes acceso a este chat' });

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: { sender: { select: { id:true, name:true, avatar:true } } },
      orderBy: { createdAt: 'asc' },
      take: parseInt(req.query.limit) || 50,
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

module.exports = router;