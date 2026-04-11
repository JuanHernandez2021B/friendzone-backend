const router     = require('express').Router();
const cloudinary = require('cloudinary').v2;
const { authenticate } = require('../middleware/auth.middleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/image', authenticate, async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'No se recibió imagen' });

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'friendzone',
      resource_type: 'image',
    });

    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

router.post('/base64', authenticate, async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'No se recibió imagen' });

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'friendzone',
      resource_type: 'image',
    });

    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

module.exports = router;