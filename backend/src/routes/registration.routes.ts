import { Router } from 'express';
import { 
  createRegistration, 
  getMyRegistrations, 
  getRegistrations, 
  scanAttendance, 
  updateRegistrationStatus, 
  submitFeedback, 
  getDashboardStats,
  deleteRegistration
} from '../controllers/registration.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();



// Protected routes
router.post('/', protect, createRegistration);
router.get('/my', protect, getMyRegistrations);
router.post('/:id/feedback', protect, submitFeedback);

// Coordinator/Admin routes
router.get('/', protect, authorize('super-admin', 'event-coordinator', 'volunteer'), getRegistrations);
router.post('/scan', protect, authorize('super-admin', 'event-coordinator', 'volunteer'), scanAttendance);
router.patch('/:id', protect, authorize('super-admin', 'event-coordinator'), updateRegistrationStatus);
router.delete('/:id', protect, authorize('super-admin', 'event-coordinator'), deleteRegistration);
router.get('/dashboard-stats', protect, authorize('super-admin', 'event-coordinator'), getDashboardStats);


export default router;
