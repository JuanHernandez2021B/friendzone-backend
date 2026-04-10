const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, bio, avatar, interests } = req.body;

    if (!name || !email || !password || !age)
      return res.status(400).json({ error: 'Nombre, email, contraseña y edad son obligatorios' });
    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    if (parseInt(age) < 18)
      return res.status(400).json({ error: 'Debes tener al menos 18 años' });
    if (await prisma.user.findUnique({ where: { email } }))
      return res.status(409).json({ error: 'El email ya está registrado' });

    const user = await prisma.user.create({
      data: {
        name, email,
        password:  await bcrypt.hash(password, 10),
        age:       parseInt(age),
        bio:       bio    || null,
        avatar:    avatar || null,
        interests: interests || [],
      },
      select: { id:true, name:true, email:true, age:true, bio:true, avatar:true, interests:true, role:true }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safe } = user;
    res.json({ user: safe, token });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword)
      return res.status(400).json({ error: 'Email y nueva contraseña son requeridos' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(404).json({ error: 'No existe una cuenta con ese email' });

    await prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(newPassword, 10) }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
});

module.exports = router;