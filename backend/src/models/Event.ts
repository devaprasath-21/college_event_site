import { Schema, model } from 'mongoose';

export interface IEvent {
  title: string;
  poster: string;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  externalLink?: string; // For online events like quizzes
  linkPublishDate?: Date;
  linkExpiryDate?: Date;
  registrationDeadline: Date;
  maxCapacity: number;
  availableSeats: number;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  prizeDetails: string;
  rules: string[];
  requirements: string[];
  facultyCoordinator: {
    name: string;
    email: string;
    phone: string;
  };
  studentCoordinator: {
    name: string;
    email: string;
    phone: string;
  };
  isPublished: boolean;
  isArchived: boolean;
  isRegistrationOpen: boolean;
  gallery: string[];
  winners?: {
    place: '1st' | '2nd' | '3rd';
    name: string;
    regNo: string;
    year: string;
  }[];
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true, trim: true },
  poster: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  externalLink: { type: String, default: '' },
  linkPublishDate: { type: Date },
  linkExpiryDate: { type: Date },
  registrationDeadline: { type: Date, required: true },
  maxCapacity: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  difficultyLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    default: 'Beginner' 
  },
  prizeDetails: { type: String, default: '' },
  rules: [{ type: String }],
  requirements: [{ type: String }],
  facultyCoordinator: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  studentCoordinator: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  isPublished: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isRegistrationOpen: { type: Boolean, default: true },
  gallery: [{ type: String }],
  winners: [{
    place: { type: String, enum: ['1st', '2nd', '3rd'], required: true },
    name: { type: String, required: true },
    regNo: { type: String, required: true },
    year: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const Event = model<IEvent>('Event', eventSchema);
