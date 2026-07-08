import { Request, Response } from 'express';
import { isMongoConnected } from '../config/db';
import { Event } from '../models/Event';
import { MockDB } from '../services/db.service';
import { AuthRequest } from '../middlewares/auth';
import { emitAnnouncement } from '../services/socket';

// @desc    Get all events (Supports filtering and searching)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req: Request, res: Response) => {
  const { category, difficulty, search, status } = req.query;

  try {
    let events: any[] = [];

    if (isMongoConnected()) {
      let query: any = {};

      // Filter by category
      if (category && category !== 'All') {
        query.category = category;
      }

      // Filter by difficulty
      if (difficulty && difficulty !== 'All') {
        query.difficultyLevel = difficulty;
      }

      // Filter by publishing status
      if (status === 'published') {
        query.isPublished = true;
        query.isArchived = false;
      } else if (status === 'archived') {
        query.isArchived = true;
      } else if (status === 'draft') {
        query.isPublished = false;
        query.isArchived = false;
      }

      // Search keyword (title, description, category, venue)
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { venue: { $regex: search, $options: 'i' } }
        ];
      }

      events = await Event.find(query).sort({ date: 1 });
    } else {
      events = MockDB.getEvents();

      // Filter category
      if (category && category !== 'All') {
        events = events.filter(e => e.category === category);
      }

      // Filter difficulty
      if (difficulty && difficulty !== 'All') {
        events = events.filter(e => e.difficultyLevel === difficulty);
      }

      // Filter status
      if (status === 'published') {
        events = events.filter(e => e.isPublished && !e.isArchived);
      } else if (status === 'archived') {
        events = events.filter(e => e.isArchived);
      } else if (status === 'draft') {
        events = events.filter(e => !e.isPublished && !e.isArchived);
      }

      // Search keyword
      if (search) {
        const keyword = (search as string).toLowerCase();
        events = events.filter(e => 
          e.title.toLowerCase().includes(keyword) || 
          e.description.toLowerCase().includes(keyword) || 
          e.category.toLowerCase().includes(keyword) ||
          e.venue.toLowerCase().includes(keyword)
        );
      }

      // Sort by date ascending
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error: any) {
    console.error('Get events error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve events', error: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let event = null;

    if (isMongoConnected()) {
      event = await Event.findById(id);
    } else {
      event = MockDB.findEventById(id);
    }

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    console.error('Get event by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve event details', error: error.message });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin / Coordinator)
export const createEvent = async (req: AuthRequest, res: Response) => {
  const eventDetails = req.body;

  // Simple validation for required fields
  const required = ['title', 'description', 'category', 'date', 'time', 'venue', 'maxCapacity', 'registrationDeadline', 'facultyCoordinator', 'studentCoordinator'];
  for (const field of required) {
    if (!eventDetails[field]) {
      return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
    }
  }

  try {
    let event = null;
    const defaultPoster = eventDetails.poster || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60';

    const payload = {
      ...eventDetails,
      poster: defaultPoster,
      availableSeats: eventDetails.maxCapacity,
      isPublished: eventDetails.isPublished !== undefined ? eventDetails.isPublished : false,
      isRegistrationOpen: eventDetails.isRegistrationOpen !== undefined ? eventDetails.isRegistrationOpen : true,
      isArchived: false,
      gallery: []
    };

    if (isMongoConnected()) {
      event = await Event.create(payload);
    } else {
      event = MockDB.createEvent(payload);
    }

    return res.status(201).json({ success: true, message: 'Event created successfully!', data: event });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
  }
};

// @desc    Update existing event
// @route   PUT /api/events/:id
// @access  Private (Admin / Coordinator)
export const updateEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    let updatedEvent = null;

    if (isMongoConnected()) {
      const prevEvent = await Event.findById(id);
      if (!prevEvent) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      // If maxCapacity changes, adjust availableSeats
      if (updateData.maxCapacity !== undefined) {
        const capacityDiff = updateData.maxCapacity - prevEvent.maxCapacity;
        updateData.availableSeats = Math.max(0, prevEvent.availableSeats + capacityDiff);
      }

      updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      updatedEvent = MockDB.updateEvent(id, updateData);
    }

    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: 'Event not found or failed to update' });
    }

    return res.status(200).json({ success: true, message: 'Event updated successfully!', data: updatedEvent });
  } catch (error: any) {
    console.error('Update event error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event', error: error.message });
  }
};

// @desc    Duplicate an event
// @route   POST /api/events/:id/duplicate
// @access  Private (Admin / Coordinator)
export const duplicateEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    let sourceEvent = null;

    if (isMongoConnected()) {
      sourceEvent = await Event.findById(id);
    } else {
      sourceEvent = MockDB.findEventById(id);
    }

    if (!sourceEvent) {
      return res.status(404).json({ success: false, message: 'Source event not found' });
    }

    // Prepare duplicate data
    const duplicateData = {
      title: `${sourceEvent.title} (Copy)`,
      poster: sourceEvent.poster,
      description: sourceEvent.description,
      category: sourceEvent.category,
      date: sourceEvent.date,
      time: sourceEvent.time,
      venue: sourceEvent.venue,
      registrationDeadline: new Date(sourceEvent.registrationDeadline),
      maxCapacity: sourceEvent.maxCapacity,
      availableSeats: sourceEvent.maxCapacity,
      difficultyLevel: sourceEvent.difficultyLevel,
      prizeDetails: sourceEvent.prizeDetails,
      rules: sourceEvent.rules,
      requirements: sourceEvent.requirements,
      facultyCoordinator: sourceEvent.facultyCoordinator,
      studentCoordinator: sourceEvent.studentCoordinator,
      isPublished: false,
      isArchived: false,
      isRegistrationOpen: sourceEvent.isRegistrationOpen,
      gallery: []
    };

    let newEvent = null;

    if (isMongoConnected()) {
      newEvent = await Event.create(duplicateData);
    } else {
      newEvent = MockDB.createEvent(duplicateData);
    }

    return res.status(201).json({ success: true, message: 'Event duplicated successfully!', data: newEvent });
  } catch (error: any) {
    console.error('Duplicate event error:', error);
    return res.status(500).json({ success: false, message: 'Failed to duplicate event', error: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    let deletedEvent = null;

    if (isMongoConnected()) {
      deletedEvent = await Event.findByIdAndDelete(id);
    } else {
      deletedEvent = MockDB.deleteEvent(id);
    }

    if (!deletedEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({ success: true, message: 'Event deleted successfully!' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message });
  }
};

// @desc    Upload media to event gallery
// @route   POST /api/events/:id/gallery
// @access  Private (Admin / Coordinator)
export const uploadGalleryMedia = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { url } = req.body; // In offline mode, take URL directly.

  if (!url) {
    return res.status(400).json({ success: false, message: 'Media URL is required' });
  }

  try {
    let updatedEvent = null;

    if (isMongoConnected()) {
      updatedEvent = await Event.findByIdAndUpdate(
        id,
        { $push: { gallery: url } },
        { new: true }
      );
    } else {
      const event = MockDB.findEventById(id);
      if (event) {
        const gallery = [...(event.gallery || []), url];
        updatedEvent = MockDB.updateEvent(id, { gallery });
      }
    }

    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({ success: true, message: 'Media added to gallery!', data: updatedEvent });
  } catch (error: any) {
    console.error('Gallery upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add media to gallery', error: error.message });
  }
};

// @desc    Announce Winners for an event
// @route   POST /api/events/:id/winners
// @access  Private (Admin / Coordinator)
export const announceWinners = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, winners } = req.body;

  try {
    let updatedEvent = null;

    if (isMongoConnected()) {
      updatedEvent = await Event.findByIdAndUpdate(
        id,
        { winners },
        { new: true }
      );
    } else {
      updatedEvent = MockDB.updateEvent(id, { winners });
      MockDB.createAnnouncement({
        title,
        content,
        category: 'Winner',
        eventId: id
      });
    }

    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    emitAnnouncement({
      _id: `ann-${Date.now()}`,
      title,
      content,
      category: 'Winner',
      eventId: id,
      date: new Date().toISOString()
    });

    return res.status(200).json({ success: true, message: 'Winners announced!', data: updatedEvent });
  } catch (error: any) {
    console.error('Announce winners error:', error);
    return res.status(500).json({ success: false, message: 'Failed to announce winners', error: error.message });
  }
};
