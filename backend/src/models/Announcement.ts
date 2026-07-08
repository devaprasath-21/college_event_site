import { Schema, model } from 'mongoose';

export interface IAnnouncement {
  title: string;
  content: string;
  category: 'General' | 'Emergency' | 'Venue Change' | 'Reminder' | 'Winner';
  eventId?: Schema.Types.ObjectId; // Reference to event if applicable
  createdAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['General', 'Emergency', 'Venue Change', 'Reminder', 'Winner'], 
    default: 'General' 
  },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  createdAt: { type: Date, default: Date.now }
});

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
