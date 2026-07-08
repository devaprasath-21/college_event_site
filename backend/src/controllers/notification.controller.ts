import { Response } from 'express';
import { isMongoConnected } from '../config/db';
import { Notification } from '../models/Notification';
import { MockDB } from '../services/db.service';
import { AuthRequest } from '../middlewares/auth';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    let notifications = [];

    if (isMongoConnected()) {
      notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    } else {
      notifications = MockDB.getNotifications()
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   POST /api/notifications/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    if (isMongoConnected()) {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    } else {
      MockDB.markNotificationsAsRead(userId);
    }

    return res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error: any) {
    console.error('Mark read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications', error: error.message });
  }
};
