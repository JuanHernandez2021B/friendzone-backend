const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { authenticate } = require('../middleware/auth.middleware');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

const DEMO_EMAILS = [
  'sofia@demo.com', 'carlos@demo.com', 'valentina@demo.com', 'andres@demo.com',
  'isabella@demo.com', 'diego@demo.com', 'camila@demo.com', 'sebastian@demo.com',
  'lucia@demo.com', 'mateo@demo.com', 'gabriela@demo.com', 'nicolas@demo.com',
  'daniela@demo.com', 'felipe@demo.com', 'mariana@demo.com', 'ricardo@demo.com',
  'paola@demo.com', 'tomas@demo.com',
];

async function autoAccept(senderId, receiverId) {
  try {
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!DEMO_EMAILS.includes(receiver.email)) return;

    const request = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } }
    });
    if (!request || request.status !== 'PENDING') return;

    await prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } });

    const [userAId, userBId] = [senderId, receiverId].sort((a, b) => a - b);
    await prisma.friendship.create({ data: { userAId, userBId } });

    await prisma.chat.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
    });
  } catch (err) {
    console.error('Error en autoAccept:', err.message);
  }
}

router.post('/request/:userId', authenticate, async (req, res) => {
  try {
    const senderId   = req.user.id;
    const receiverId = parseInt(req.params.userId);

    if (senderId === receiverId)
      return res.status(400).json({ error: 'No puedes enviarte solicitud a ti mismo' });

    if (await prisma.friendRequest.findUnique({ where: { senderId_receiverId: { senderId, receiverId } } }))
      return res.status(409).json({ error: 'Solicitud ya enviada' });

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: {
        sender:   { select: { id:true, name:true, avatar:true } },
        receiver: { select: { id:true, name:true, avatar:true } },
      }
    });

    autoAccept(senderId, receiverId);

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
});

router.get('/requests', authenticate, async (req, res) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: req.user.id, status: 'PENDING' },
      include: { sender: { select: { id:true, name:true, age:true, bio:true, avatar:true, interests:true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch { res.status(500).json({ error: 'Error al obtener solicitudes' }); }
});

router.put('/request/:id/accept', authenticate, async (req, res) => {
  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (request.receiverId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } });

    const [userAId, userBId] = [request.senderId, request.receiverId].sort((a, b) => a - b);
    await prisma.friendship.create({ data: { userAId, userBId } });

    await prisma.chat.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
    });

    res.json({ message: '¡Ahora son amigos!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aceptar solicitud' });
  }
});

router.put('/request/:id/reject', authenticate, async (req, res) => {
  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (request.receiverId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'REJECTED' } });
    res.json({ message: 'Solicitud rechazada' });
  } catch { res.status(500).json({ error: 'Error al rechazar solicitud' }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const myId = req.user.id;
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: myId }, { userBId: myId }] },
      include: {
        userA: { select: { id:true, name:true, age:true, bio:true, avatar:true, interests:true } },
        userB: { select: { id:true, name:true, age:true, bio:true, avatar:true, interests:true } },
      }
    });
    const friends = friendships.map(f => f.userAId === myId ? f.userB : f.userA);
    res.json(friends);
  } catch { res.status(500).json({ error: 'Error al obtener amigos' }); }
});

router.delete('/:friendId', authenticate, async (req, res) => {
  try {
    const [userAId, userBId] = [req.user.id, parseInt(req.params.friendId)].sort((a, b) => a - b);
    await prisma.friendship.deleteMany({ where: { userAId, userBId } });
    res.json({ message: 'Amistad eliminada' });
  } catch { res.status(500).json({ error: 'Error al eliminar amistad' }); }
});

module.exports = router;