import { Schema, model } from 'mongoose';

export interface IUser {
  username: string;
  name?: string;
  email: string;
  password?: string;
  role: 'super-admin' | 'event-coordinator' | 'volunteer' | 'student';
  registrationNumber?: string;
  department?: string;
  year?: string;
  section?: string;
  phoneNumber?: string;
  participationPoints: number;
  streak: number;
  badges: string[];
  favoriteEvents: Schema.Types.ObjectId[];
  coordinatorId?: string;
  assignedEvent?: string;
  eventRole?: string;
  isLocked?: boolean;
  plaintextPassword?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String }, // Optional for Google OAuth users
  role: { 
    type: String, 
    enum: ['super-admin', 'event-coordinator', 'volunteer', 'student'], 
    default: 'student' 
  },
  registrationNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  year: { type: String, trim: true },
  section: { type: String, trim: true },
  phoneNumber: { type: String, trim: true },
  participationPoints: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  badges: [{ type: String }],
  favoriteEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  createdAt: { type: Date, default: Date.now },
  coordinatorId: { type: String, trim: true },
  assignedEvent: { type: String, trim: true },
  eventRole: { type: String, trim: true },
  isLocked: { type: Boolean, default: false },
  plaintextPassword: { type: String }
});

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

export const User = model<IUser>('User', userSchema);
