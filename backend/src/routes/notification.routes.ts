import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.get('/', protect, getNotifications);
router.post('/read', protect, markAsRead);

export default router;
