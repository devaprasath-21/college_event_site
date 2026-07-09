import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

// Load Environment variables
dotenv.config();

import { connectDB } from './config/db';
import { initSocket } from './services/socket';

// Route Imports
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import registrationRoutes from './routes/registration.routes';
import announcementRoutes from './routes/announcement.routes';
import notificationRoutes from './routes/notification.routes';
import supportRoutes from './routes/support.routes';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploaded posters/files if needed
app.use('/uploads', express.static('uploads'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Boot Server Function
const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Initialize Socket.io
  initSocket(server);

  // Start HTTP Server
  server.listen(PORT, () => {
    console.log(`🚀 CampusHub Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
