import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Interface for DB Structure
interface DatabaseSchema {
  users: any[];
  events: any[];
  registrations: any[];
  announcements: any[];
  notifications: any[];
  supportTickets: any[];
}

// Initial Mock Seed Data
const initialDB: DatabaseSchema = {
  users: [
    {
      _id: "u_admin1",
      username: "GTEC Admin",
      email: "admin@gtec.edu.in",
      password: "$2a$10$vK6hD3r5h6oM/TewY7Vp3uR5J2Z4GfXmXj7P7G6kFfW2gH8z5bB/a", // bcrypt hash for 'admin123'
      role: "super-admin",
      createdAt: new Date().toISOString()
    },
    {
      _id: "u_coordinator1",
      username: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@gtec.edu.in",
      password: "$2a$10$vK6hD3r5h6oM/TewY7Vp3uR5J2Z4GfXmXj7P7G6kFfW2gH8z5bB/a", // 'admin123'
      role: "event-coordinator",
      createdAt: new Date().toISOString()
    },
    {
      _id: "u_student1",
      username: "Aditya Sharma",
      email: "aditya.sharma@gtec.edu.in",
      role: "student",
      registrationNumber: "SRM12345",
      department: "Computer Science",
      year: "3rd",
      section: "A",
      phoneNumber: "9876543210",
      participationPoints: 120,
      streak: 3,
      badges: ["Early Bird", "Code Master"],
      createdAt: new Date().toISOString()
    }
  ],
  events: [
    {
      _id: "e_event1",
      title: "National Hackathon 2026",
      poster: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
      description: "Join the ultimate 24-hour coding challenge. Solve real-world issues, build innovative prototypes, and win grand cash prizes!",
      category: "Technical",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      time: "09:00 AM",
      venue: "Main Auditorium, Block C",
      registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      maxCapacity: 100,
      availableSeats: 98,
      difficultyLevel: "Advanced",
      prizeDetails: "First Prize: $1500, Second Prize: $1000, Third Prize: $500",
      rules: [
        "Teams must consist of 2-4 members.",
        "Use of pre-existing code is prohibited.",
        "Laptops and chargers must be brought by the participants."
      ],
      requirements: [
        "Basic coding experience in TS/JS or Python.",
        "Bring college ID."
      ],
      facultyCoordinator: { name: "Dr. Rajesh Kumar", email: "rajesh.kumar@campushub.edu", phone: "9988776655" },
      studentCoordinator: { name: "Aditya Sharma", email: "aditya.sharma@srm.edu", phone: "9876543210" },
      isPublished: true,
      isArchived: false,
      isRegistrationOpen: true,
      gallery: [],
      createdAt: new Date().toISOString()
    },
    {
      _id: "e_event2",
      title: "Symposium of Art & Design",
      poster: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=60",
      description: "Express your creativity at the biggest cultural event of the year. Show your skills in sketching, graphic design, and UI layouts.",
      category: "Cultural",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
      time: "02:00 PM",
      venue: "Exhibition Hall, Block A",
      registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      maxCapacity: 50,
      availableSeats: 50,
      difficultyLevel: "Beginner",
      prizeDetails: "Trophies and certificates for all finalists.",
      rules: [
        "All work must be completed on-site.",
        "Materials will be provided."
      ],
      requirements: [
        "Interest in design."
      ],
      facultyCoordinator: { name: "Prof. Priya Sen", email: "priya.sen@campushub.edu", phone: "8877665544" },
      studentCoordinator: { name: "Neha Roy", email: "neha.roy@srm.edu", phone: "8765432109" },
      isPublished: true,
      isArchived: false,
      isRegistrationOpen: true,
      gallery: [],
      createdAt: new Date().toISOString()
    }
  ],
  registrations: [],
  announcements: [],
  notifications: [],
  supportTickets: []
};

class MockDBService {
  private data: DatabaseSchema = initialDB;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DATA_FILE)) {
        this.save();
      } else {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log('Local JSON Mock DB loaded successfully from data/db.json');
      }
    } catch (err) {
      console.error('Failed to initialize local JSON database:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to local JSON database:', err);
    }
  }

  // Helper ID Generator
  private genId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // --- User Operations ---
  getUsers() { return this.data.users; }
  findUserById(id: string) { return this.data.users.find(u => u._id === id); }
  findUserByEmail(email: string) { return this.data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()); }
  findUserByUsername(username: string) { return this.data.users.find(u => u.username?.toLowerCase() === username.toLowerCase()); }
  createUser(userData: any) {
    const newUser = {
      _id: this.genId('u'),
      participationPoints: 0,
      streak: 0,
      badges: [],
      favoriteEvents: [],
      createdAt: new Date().toISOString(),
      ...userData
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
  updateUser(id: string, updateData: any) {
    const idx = this.data.users.findIndex(u => u._id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updateData };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }
  deleteUser(id: string) {
    const idx = this.data.users.findIndex(u => u._id === id);
    if (idx !== -1) {
      const deleted = this.data.users.splice(idx, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }

  // --- Event Operations ---
  getEvents() { return this.data.events; }
  findEventById(id: string) { return this.data.events.find(e => e._id === id); }
  createEvent(eventData: any) {
    const newEvent = {
      _id: this.genId('e'),
      isPublished: false,
      isArchived: false,
      isRegistrationOpen: true,
      gallery: [],
      availableSeats: eventData.maxCapacity || 100,
      createdAt: new Date().toISOString(),
      ...eventData
    };
    this.data.events.push(newEvent);
    this.save();
    return newEvent;
  }
  updateEvent(id: string, updateData: any) {
    const idx = this.data.events.findIndex(e => e._id === id);
    if (idx !== -1) {
      const prevEvent = this.data.events[idx];
      // Adjust seats if max capacity changes
      if (updateData.maxCapacity !== undefined) {
        const capacityDiff = updateData.maxCapacity - prevEvent.maxCapacity;
        updateData.availableSeats = Math.max(0, (prevEvent.availableSeats || 0) + capacityDiff);
      }
      this.data.events[idx] = { ...prevEvent, ...updateData };
      this.save();
      return this.data.events[idx];
    }
    return null;
  }
  deleteEvent(id: string) {
    const idx = this.data.events.findIndex(e => e._id === id);
    if (idx !== -1) {
      const deleted = this.data.events.splice(idx, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }

  // --- Registration Operations ---
  getRegistrations() { return this.data.registrations; }
  findRegistrationById(id: string) { return this.data.registrations.find(r => r._id === id); }
  createRegistration(regData: any) {
    const newReg = {
      _id: this.genId('r'),
      registrationId: `CH-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Approved', // Auto-approved by default for simplicity
      attended: false,
      createdAt: new Date().toISOString(),
      ...regData
    };
    this.data.registrations.push(newReg);
    
    // Decrement available seats in event
    const event = this.findEventById(regData.eventId);
    if (event) {
      this.updateEvent(event._id, { availableSeats: Math.max(0, (event.availableSeats || 1) - 1) });
    }

    this.save();
    return newReg;
  }
  updateRegistration(id: string, updateData: any) {
    const idx = this.data.registrations.findIndex(r => r._id === id);
    if (idx !== -1) {
      const prevReg = this.data.registrations[idx];
      this.data.registrations[idx] = { ...prevReg, ...updateData };
      this.save();
      return this.data.registrations[idx];
    }
    return null;
  }
  deleteRegistration(id: string) {
    const idx = this.data.registrations.findIndex(r => r._id === id);
    if (idx !== -1) {
      const deleted = this.data.registrations.splice(idx, 1)[0];
      if (deleted.status !== 'Cancelled') {
        const event = this.findEventById(deleted.eventId);
        if (event) {
          this.updateEvent(event._id, { availableSeats: (event.availableSeats || 0) + 1 });
        }
      }
      this.save();
      return deleted;
    }
    return null;
  }

  // --- Announcement Operations ---
  getAnnouncements() { return this.data.announcements; }
  createAnnouncement(annData: any) {
    const newAnn = {
      _id: this.genId('a'),
      createdAt: new Date().toISOString(),
      ...annData
    };
    this.data.announcements.push(newAnn);
    this.save();
    return newAnn;
  }
  updateAnnouncement(id: string, updateData: any) {
    const annIndex = this.data.announcements.findIndex(a => a._id === id);
    if (annIndex !== -1) {
      this.data.announcements[annIndex] = { ...this.data.announcements[annIndex], ...updateData };
      this.save();
      return this.data.announcements[annIndex];
    }
    return null;
  }
  deleteAnnouncement(id: string) {
    const annIndex = this.data.announcements.findIndex(a => a._id === id);
    if (annIndex !== -1) {
      this.data.announcements.splice(annIndex, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Support Ticket Operations ---
  getSupportTickets() { return this.data.supportTickets; }
  createSupportTicket(ticketData: any) {
    const newTicket = {
      _id: this.genId('s'),
      status: 'Open',
      createdAt: new Date().toISOString(),
      ...ticketData
    };
    this.data.supportTickets.push(newTicket);
    this.save();
    return newTicket;
  }
  updateSupportTicketStatus(id: string, status: string) {
    const tIndex = this.data.supportTickets.findIndex(t => t._id === id);
    if (tIndex !== -1) {
      this.data.supportTickets[tIndex].status = status;
      this.save();
      return this.data.supportTickets[tIndex];
    }
    return null;
  }
  deleteSupportTicket(id: string) {
    const tIndex = this.data.supportTickets.findIndex(t => t._id === id);
    if (tIndex !== -1) {
      this.data.supportTickets.splice(tIndex, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Notification Operations ---
  getNotifications() { return this.data.notifications; }
  createNotification(notifData: any) {
    const newNotif = {
      _id: this.genId('n'),
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notifData
    };
    this.data.notifications.push(newNotif);
    this.save();
    return newNotif;
  }
  markNotificationsAsRead(userId: string) {
    let updatedCount = 0;
    this.data.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        updatedCount++;
      }
    });
    if (updatedCount > 0) this.save();
    return updatedCount;
  }
}

export const MockDB = new MockDBService();
export type { DatabaseSchema };
