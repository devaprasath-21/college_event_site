const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');

try {
  if (fs.existsSync(dbPath)) {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(rawData);

    // Filter out announcements with category "Winner"
    if (db.announcements) {
      const originalCount = db.announcements.length;
      db.announcements = db.announcements.filter(a => a.category !== 'Winner');
      const newCount = db.announcements.length;
      console.log(`Removed ${originalCount - newCount} winner announcements.`);
    }

    // Clear winners from events if there are any
    if (db.events) {
      db.events.forEach(e => {
        if (e.winners) {
          e.winners = [];
        }
      });
      console.log('Cleared winners array from all events.');
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('Successfully updated db.json');
  } else {
    console.log('db.json not found!');
  }
} catch (error) {
  console.error('Error updating db.json:', error);
}
