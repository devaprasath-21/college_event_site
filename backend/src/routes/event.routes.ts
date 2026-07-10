import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, duplicateEvent, deleteEvent, uploadGalleryMedia, announceWinners } from '../controllers/event.controller';
import { protect, authorize, optionalAuth } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// Protected admin/coordinator routes
router.post('/', protect, authorize('super-admin', 'event-coordinator'), createEvent);
router.put('/:id', protect, authorize('super-admin', 'event-coordinator'), updateEvent);
router.post('/:id/duplicate', protect, authorize('super-admin', 'event-coordinator'), duplicateEvent);
router.delete('/:id', protect, authorize('super-admin', 'event-coordinator'), deleteEvent);
router.post('/:id/gallery', protect, authorize('super-admin', 'event-coordinator'), uploadGalleryMedia);
router.post('/:id/winners', protect, authorize('super-admin', 'event-coordinator'), announceWinners);

export default router;
