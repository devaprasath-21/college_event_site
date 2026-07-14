import { Schema, model } from 'mongoose';

export interface IRegistration {
  registrationId: string; // Unique ticket ID
  studentId: Schema.Types.ObjectId;
  eventId: Schema.Types.ObjectId;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  qrCodeUrl?: string; // QR code image URL or base64 representation
  attended: boolean;
  attendedAt?: Date;
  certificateIssued?: boolean;
  feedback?: {
    rating: number;
    comment: string;
    suggestions?: string;
    submittedAt: Date;
  };
  createdAt: Date;
}

const registrationSchema = new Schema<IRegistration>({
  registrationId: { type: String, required: true, unique: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
    default: 'Approved' 
  },
  qrCodeUrl: { type: String },
  attended: { type: Boolean, default: false },
  attendedAt: { type: Date },
  certificateIssued: { type: Boolean, default: false },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    suggestions: { type: String },
    submittedAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});

registrationSchema.index({ eventId: 1, studentId: 1 });
registrationSchema.index({ status: 1 });

export const Registration = model<IRegistration>('Registration', registrationSchema);
