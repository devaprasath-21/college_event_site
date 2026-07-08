import { Request, Response } from 'express';
import { isMongoConnected } from '../config/db';
import { SupportTicket } from '../models/SupportTicket';
import { MockDB } from '../services/db.service';
import { AuthRequest } from '../middlewares/auth';

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Private (Student)
export const createTicket = async (req: AuthRequest, res: Response) => {
  const { subject, message } = req.body;
  const studentId = req.user?.id;

  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Subject and message are required' });
  }

  try {
    const payload = {
      studentId,
      subject,
      message,
    };

    let ticket = null;

    if (isMongoConnected()) {
      ticket = await SupportTicket.create(payload);
    } else {
      ticket = MockDB.createSupportTicket(payload);
    }

    return res.status(201).json({ success: true, message: 'Support ticket submitted successfully!', data: ticket });
  } catch (error: any) {
    console.error('Create support ticket error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit ticket', error: error.message });
  }
};

// @desc    Get all support tickets
// @route   GET /api/support
// @access  Private (Admin / Coordinator)
export const getTickets = async (req: Request, res: Response) => {
  try {
    let tickets = [];

    if (isMongoConnected()) {
      tickets = await SupportTicket.find({}).populate('studentId', 'name username email registrationNumber year').sort({ createdAt: -1 });
    } else {
      const allTickets = MockDB.getSupportTickets();
      tickets = allTickets.map(t => ({
        ...t,
        studentId: MockDB.findUserById(t.studentId)
      }));
      tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error: any) {
    console.error('Get support tickets error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tickets', error: error.message });
  }
};

// @desc    Update support ticket status
// @route   PATCH /api/support/:id/status
// @access  Private (Admin / Coordinator)
export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    let ticket = null;

    if (isMongoConnected()) {
      ticket = await SupportTicket.findByIdAndUpdate(id, { status }, { new: true });
    } else {
      ticket = MockDB.updateSupportTicketStatus(id, status);
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    return res.status(200).json({ success: true, message: 'Status updated successfully', data: ticket });
  } catch (error: any) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update ticket', error: error.message });
  }
};

// @desc    Delete support ticket
// @route   DELETE /api/support/:id
// @access  Private (Admin / Coordinator)
export const deleteTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    let deleted = false;
    
    if (isMongoConnected()) {
      const result = await SupportTicket.findByIdAndDelete(id);
      deleted = !!result;
    } else {
      deleted = MockDB.deleteSupportTicket(id);
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    return res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error: any) {
    console.error('Delete ticket error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete ticket', error: error.message });
  }
};
