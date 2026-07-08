import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // In production, replace with specific frontend URL
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room for specific user notifications
    socket.on('join_user', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their notifications room`);
    });

    // Join room for specific event real-time updates
    socket.on('join_event', (eventId: string) => {
      socket.join(`event_${eventId}`);
      console.log(`Socket ${socket.id} joined room event_${eventId}`);
    });

    // Leave event room
    socket.on('leave_event', (eventId: string) => {
      socket.leave(`event_${eventId}`);
      console.log(`Socket ${socket.id} left room event_${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
};

// --- Custom Broadcast Triggers ---

// Emit general notification to a user
export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(userId).emit('new_notification', notification);
    console.log(`Emitted notification to user ${userId}`);
  }
};

// Emit live registration update for an event
export const emitRegistrationUpdate = (eventId: string, data: { availableSeats: number; registrationCount: number }) => {
  if (io) {
    io.to(`event_${eventId}`).emit('registration_updated', data);
    io.emit('global_dashboard_update'); // Tell admins to fetch fresh stats
    console.log(`Emitted registration update for event ${eventId}`);
  }
};

// Emit live attendance scan confirmation
export const emitAttendanceUpdate = (eventId: string, data: { attendedCount: number; remainingCapacity: number }) => {
  if (io) {
    io.to(`event_${eventId}`).emit('attendance_updated', data);
    io.emit('global_dashboard_update');
    console.log(`Emitted attendance update for event ${eventId}`);
  }
};

// Broadcast site-wide announcement
export const emitAnnouncement = (announcement: any) => {
  if (io) {
    io.emit('new_announcement', announcement);
    console.log('Emitted global announcement');
  }
};
