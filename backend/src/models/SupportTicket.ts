import { Schema, model } from 'mongoose';

export interface ISupportTicket {
  studentId: Schema.Types.ObjectId;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Resolved'], 
    default: 'Open' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);
