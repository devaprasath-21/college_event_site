import { Router } from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', getAnnouncements);
router.post('/', protect, authorize('super-admin', 'event-coordinator'), createAnnouncement);
router.put('/:id', protect, authorize('super-admin', 'event-coordinator'), updateAnnouncement);
router.delete('/:id', protect, authorize('super-admin', 'event-coordinator'), deleteAnnouncement);

export default router;
