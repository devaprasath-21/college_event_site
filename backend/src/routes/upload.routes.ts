import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'));
    }
  }
});

router.post('/', protect, authorize('super-admin', 'event-coordinator'), upload.single('poster'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, url: fileUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
