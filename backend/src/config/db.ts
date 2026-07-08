import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campushub';
    console.log(`Connecting to MongoDB: ${mongoUri}...`);
    
    // Set a short timeout (3000ms) for local checking so it falls back quickly if Mongo isn't running
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('MongoDB Connected Successfully!');
  } catch (error: any) {
    console.warn('⚠️ MongoDB connection failed. CampusHub will fall back to Local JSON File Database.');
    console.warn(`Details: ${error.message}`);
    isConnected = false;
  }
};

export const isMongoConnected = () => isConnected;
export const setMongoConnected = (connected: boolean) => {
  isConnected = connected;
};
