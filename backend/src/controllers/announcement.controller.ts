import { Request, Response } from 'express';
import { isMongoConnected } from '../config/db';
import { Announcement } from '../models/Announcement';
import { MockDB } from '../services/db.service';
import { AuthRequest } from '../middlewares/auth';
import { emitAnnouncement } from '../services/socket';

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    let announcements = [];

    if (isMongoConnected()) {
      announcements = await Announcement.find({}).populate('eventId', 'title').sort({ createdAt: -1 });
    } else {
      announcements = MockDB.getAnnouncements().map(a => ({
        ...a,
        eventId: MockDB.findEventById(a.eventId)
      }));
      announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (error: any) {
    console.error('Get announcements error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve announcements', error: error.message });
  }
};

// @desc    Create a new announcement (Broadcasts via Socket)
// @route   POST /api/announcements
// @access  Private (Admin / Coordinator)
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  const { title, content, category, eventId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  try {
    const payload = {
      title,
      content,
      category: category || 'General',
      eventId: eventId || undefined
    };

    let announcement = null;

    if (isMongoConnected()) {
      announcement = await Announcement.create(payload);
      if (eventId) {
        announcement = await Announcement.findById(announcement._id).populate('eventId', 'title');
      }
    } else {
      announcement = MockDB.createAnnouncement(payload);
      if (eventId) {
        announcement.eventId = MockDB.findEventById(eventId);
      }
    }

    // Broadcast in real-time
    emitAnnouncement(announcement);

    return res.status(201).json({ success: true, message: 'Announcement published successfully!', data: announcement });
  } catch (error: any) {
    console.error('Create announcement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to publish announcement', error: error.message });
  }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin / Coordinator)
export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, category, eventId } = req.body;

  try {
    const updateData = { title, content, category, eventId };
    let announcement = null;

    if (isMongoConnected()) {
      announcement = await Announcement.findByIdAndUpdate(id, updateData, { new: true }).populate('eventId', 'title');
    } else {
      announcement = MockDB.updateAnnouncement(id, updateData);
    }

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Broadcast update
    emitAnnouncement(announcement);

    return res.status(200).json({ success: true, message: 'Announcement updated successfully', data: announcement });
  } catch (error: any) {
    console.error('Update announcement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update announcement', error: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin / Coordinator)
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    let success = false;

    if (isMongoConnected()) {
      const deleted = await Announcement.findByIdAndDelete(id);
      success = !!deleted;
    } else {
      success = MockDB.deleteAnnouncement(id);
    }

    if (!success) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement', error: error.message });
  }
};
