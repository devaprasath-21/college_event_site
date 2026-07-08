import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

const wipeAndSeed = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://devprasath1708_db_user:vnK6BPMQ2RblEbXC@ac-kxvjase-shard-00-00.jauslom.mongodb.net:27017,ac-kxvjase-shard-00-01.jauslom.mongodb.net:27017,ac-kxvjase-shard-00-02.jauslom.mongodb.net:27017/campushub?ssl=true&replicaSet=atlas-13pxtm-shard-0&authSource=admin&retryWrites=true&w=majority';
    let mongoUri = MONGO_URI.replace('localhost', '127.0.0.1');
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Wipe everything
    console.log('Wiping all collections...');
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.drop();
        console.log(`Dropped collection: ${collection.collectionName}`);
      }
      console.log('Database wiped successfully.');
    }

    // 2. Create the new admin user
    console.log('Creating new admin user...');
    
    const User = require('./src/models/User').default || require('./src/models/User');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('deva@212006', salt);

    const adminUser = new User({
      username: 'Admin',
      email: 'devprasath1708@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    await adminUser.save();
    console.log('New admin user created successfully!');
    console.log(`Admin Email: devprasath1708@gmail.com`);

    process.exit(0);
  } catch (error) {
    console.error('Error during wipe and seed:', error);
    process.exit(1);
  }
};

wipeAndSeed();
