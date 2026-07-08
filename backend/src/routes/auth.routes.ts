import { Router } from 'express';
import { login, register, completeProfile, updateProfile, getMe, getAllMembers, createCoordinator, getCoordinators, toggleCoordinatorLock, deleteCoordinator, deleteMember } from '../controllers/auth.controller';
import { resetPassword } from '../controllers/password.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', resetPassword);
router.post('/complete-profile', protect, completeProfile);
router.put('/profile', protect, updateProfile);
router.get('/me', protect, getMe);
router.get('/members', protect, authorize('super-admin', 'event-coordinator'), getAllMembers);
router.delete('/members/:id', protect, authorize('super-admin'), deleteMember);
router.post('/coordinators', protect, authorize('super-admin'), createCoordinator);
router.get('/coordinators', protect, authorize('super-admin'), getCoordinators);
router.patch('/coordinators/:id/lock', protect, authorize('super-admin'), toggleCoordinatorLock);
router.delete('/coordinators/:id', protect, authorize('super-admin'), deleteCoordinator);

export default router;
