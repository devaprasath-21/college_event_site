import { Router } from 'express';
import { createTicket, getTickets, updateTicketStatus, deleteTicket } from '../controllers/support.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.post('/', protect, authorize('student'), createTicket);
router.get('/', protect, authorize('super-admin', 'event-coordinator'), getTickets);
router.patch('/:id/status', protect, authorize('super-admin', 'event-coordinator'), updateTicketStatus);
router.delete('/:id', protect, authorize('super-admin', 'event-coordinator'), deleteTicket);

export default router;
