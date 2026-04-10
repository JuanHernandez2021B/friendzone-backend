const router  = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

const SAFE = { id:true, name:true, email:true, age:true, bio:true, avatar:true, interests:true, role:true, createdAt:true };

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: SAFE });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch { res.status(500).json({ error: 'Error al obtener perfil' }); }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, age, bio, avatar, interests } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name      && { name }),
        ...(age       && { age: parseInt(age) }),
        ...(bio       !== undefined && { bio }),
        ...(avatar    !== undefined && { avatar }),
        ...(interests && { interests }),
      },
      select: SAFE
    });
    res.json(user);
  } catch { res.status(500).json({ error: 'Error al actualizar perfil' }); }
});

router.delete('/me', authenticate, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: 'Cuenta eliminada' });
  } catch { res.status(500).json({ error: 'Error al eliminar cuenta' }); }
});

router.get('/discover', authenticate, async (req, res) => {
  try {
    const myId = req.user.id;

    const requests = await prisma.friendRequest.findMany({
      where: { OR: [{ senderId: myId }, { receiverId: myId }] },
      select: { senderId:true, receiverId:true }
    });
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: myId }, { userBId: myId }] },
      select: { userAId:true, userBId:true }
    });

    const excluded = new Set([myId]);
    requests.forEach(r => { excluded.add(r.senderId); excluded.add(r.receiverId); });
    friendships.forEach(f => { excluded.add(f.userAId); excluded.add(f.userBId); });

    const users = await prisma.user.findMany({
      where: { id: { notIn: [...excluded] } },
      select: { id:true, name:true, age:true, bio:true, avatar:true, interests:true },
      take: 20,
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id:true, name:true, age:true, bio:true, avatar:true, interests:true }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch { res.status(500).json({ error: 'Error al obtener usuario' }); }
});

router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: SAFE });
    res.json(users);
  } catch { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;