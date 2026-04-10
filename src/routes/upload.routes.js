const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { authenticate } = require('../middleware/auth.middleware');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${req.user.id}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Solo imágenes'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/image', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  const baseUrl  = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

router.post('/base64', authenticate, (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'No se recibió imagen' });

    const matches = base64.match(/^data:image\/([a-zA-Z]+);base64,/);
    const ext     = matches ? matches[1] : 'jpg';
    const data    = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer  = Buffer.from(data, 'base64');
    const filename = `${Date.now()}-${req.user.id}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);

    const baseUrl  = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const imageUrl = `${baseUrl}/uploads/${filename}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar imagen' });
  }
});

module.exports = router;