import { Schema, model } from 'mongoose';

export interface INotification {
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: 'Alert' | 'Announcement' | 'System';
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Alert', 'Announcement', 'System'], 
    default: 'System' 
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = model<INotification>('Notification', notificationSchema);
