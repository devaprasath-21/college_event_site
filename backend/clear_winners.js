const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/campushub';

async function clearWinners() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // 1. Delete all Winner announcements
    const Announcement = mongoose.connection.collection('announcements');
    const deleteResult = await Announcement.deleteMany({ category: 'Winner' });
    console.log(`Deleted ${deleteResult.deletedCount} winner announcements.`);

    // 2. Clear winners array in all events
    const Event = mongoose.connection.collection('events');
    const updateResult = await Event.updateMany({}, { $set: { winners: [] } });
    console.log(`Cleared winners from ${updateResult.modifiedCount} events.`);

    console.log('Successfully cleared all winners lists.');
  } catch (err) {
    console.error('Error clearing winners:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

clearWinners();
