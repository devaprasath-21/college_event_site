import { Router } from 'express';
import { 
  createRegistration, 
  getMyRegistrations, 
  getRegistrations, 
  scanAttendance, 
  updateRegistrationStatus, 
  submitFeedback, 
  downloadCertificate, 
  verifyCertificate, 
  getDashboardStats,
  bulkVerifyAttendance,
  deleteRegistration,
  issueCertificate
} from '../controllers/registration.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

// Public routes for certificate downloading & lookup verification
router.get('/:id/certificate', downloadCertificate);
router.get('/verify/:regId', verifyCertificate);

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
router.post('/bulk-verify', protect, authorize('super-admin', 'event-coordinator'), bulkVerifyAttendance);
router.patch('/:id/issue', protect, authorize('super-admin', 'event-coordinator'), issueCertificate);

export default router;
