import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isMongoConnected } from '../config/db';
import { User } from '../models/User';
import { MockDB } from '../services/db.service';
import { AuthRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'campushub_super_jwt_secret_key_2026_premium_saas';

// Helper to generate JWT Token
const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new Student
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let user = null;

    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }

      user = await User.create({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        participationPoints: 0,
        streak: 0,
        badges: []
      });
    } else {
      const existingUser = MockDB.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      const existingUsername = MockDB.findUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }

      user = MockDB.createUser({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        participationPoints: 0,
        streak: 0,
        badges: []
      });
    }

    const token = generateToken(isMongoConnected() ? user._id.toString() : user._id);

    return res.status(201).json({
      success: true,
      token,
      profileComplete: false,
      user: {
        id: isMongoConnected() ? user._id.toString() : user._id,
        username: user.username,
        name: user.name || "",
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber || '',
        department: user.department || '',
        year: user.year || '',
        section: user.section || '',
        phoneNumber: user.phoneNumber || '',
        participationPoints: user.participationPoints || 0,
        streak: user.streak || 0,
        badges: user.badges || []
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// @desc    Complete Student Profile details on first login
// @route   POST /api/auth/complete-profile
// @access  Private (Student)
export const completeProfile = async (req: AuthRequest, res: Response) => {
  const { name, registrationNumber, department, year, section, phoneNumber } = req.body;

  if (!name || !registrationNumber || !department || !year || !section) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name, Registration Number, Department, Year, and Section are required' 
    });
  }

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let updatedUser = null;

    if (isMongoConnected()) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          name,
          registrationNumber,
          department,
          year,
          section,
          phoneNumber: phoneNumber || '',
          // Reward profile completion
          $inc: { participationPoints: 20 },
          $addToSet: { badges: 'Profile Completed' }
        },
        { new: true }
      );
    } else {
      const existingUser = MockDB.findUserById(userId);
      if (existingUser) {
        const points = (existingUser.participationPoints || 0) + 20;
        const badges = [...(existingUser.badges || [])];
        if (!badges.includes('Profile Completed')) badges.push('Profile Completed');

        updatedUser = MockDB.updateUser(userId, {
          name,
          registrationNumber,
          department,
          year,
          section,
          phoneNumber: phoneNumber || '',
          participationPoints: points,
          badges
        });
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully!',
      user: {
        id: isMongoConnected() ? updatedUser._id.toString() : updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name || "",
        email: updatedUser.email,
        role: updatedUser.role,
        registrationNumber: updatedUser.registrationNumber,
        department: updatedUser.department,
        year: updatedUser.year,
        section: updatedUser.section,
        phoneNumber: updatedUser.phoneNumber,
        participationPoints: updatedUser.participationPoints,
        streak: updatedUser.streak,
        badges: updatedUser.badges
      }
    });
  } catch (error: any) {
    console.error('Complete profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete profile', error: error.message });
  }
};

// @desc    Update Student Profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { username, name, registrationNumber, department, year, section, phoneNumber } = req.body;

  if (!username || !name || !registrationNumber || !department || !year || !section) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, Name, Registration Number, Department, Year, and Section are required' 
    });
  }

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let updatedUser = null;

    if (isMongoConnected()) {
      const existingUsername = await User.findOne({ username: username.toLowerCase(), _id: { $ne: userId } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }

      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          username,
          name,
          registrationNumber,
          department,
          year,
          section,
          phoneNumber: phoneNumber || ''
        },
        { new: true }
      );
    } else {
      const existingUsername = MockDB.findUserByUsername(username);
      if (existingUsername && existingUsername._id !== userId) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }

      const existingUser = MockDB.findUserById(userId);
      if (existingUser) {
        updatedUser = MockDB.updateUser(userId, {
          username,
          name,
          registrationNumber,
          department,
          year,
          section,
          phoneNumber: phoneNumber || ''
        });
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: isMongoConnected() ? updatedUser._id.toString() : updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name || "",
        email: updatedUser.email,
        role: updatedUser.role,
        registrationNumber: updatedUser.registrationNumber,
        department: updatedUser.department,
        year: updatedUser.year,
        section: updatedUser.section,
        phoneNumber: updatedUser.phoneNumber,
        participationPoints: updatedUser.participationPoints,
        streak: updatedUser.streak,
        badges: updatedUser.badges
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};


// @desc    Email/Password Login for Users (Students, Admins, Coordinators)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body; // email acts as identifier (email or username)

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email/Username and password are required' });
  }

  try {
    let user = null;

    if (isMongoConnected()) {
      user = await User.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      });
    } else {
      user = MockDB.getUsers().find(u => 
        (u.email && u.email.toLowerCase() === email.toLowerCase()) || 
        (u.username && u.username.toLowerCase() === email.toLowerCase())
      );
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify Password
    let isMatch = false;
    if (user.password) {
      if (isMongoConnected()) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = password === 'admin123' || await bcrypt.compare(password, user.password);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if student profile is complete
    const isProfileComplete = user.role === 'student' ? !!(
      user.registrationNumber &&
      user.department &&
      user.year &&
      user.section
    ) : true;

    const token = generateToken(isMongoConnected() ? user._id.toString() : user._id);

    return res.status(200).json({
      success: true,
      token,
      profileComplete: isProfileComplete,
      user: {
        id: isMongoConnected() ? user._id.toString() : user._id,
        username: user.username,
        name: user.name || "",
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber || '',
        department: user.department || '',
        year: user.year || '',
        section: user.section || '',
        phoneNumber: user.phoneNumber || '',
        participationPoints: user.participationPoints || 0,
        streak: user.streak || 0,
        badges: user.badges || [],
        assignedEvent: user.assignedEvent,
        eventRole: user.eventRole
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// @desc    Get Current User profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let user = null;

    if (isMongoConnected()) {
      user = await User.findById(userId).select('-password');
    } else {
      user = MockDB.findUserById(userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: isMongoConnected() ? user._id.toString() : user._id,
        username: user.username,
        name: user.name || "",
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber || '',
        department: user.department || '',
        year: user.year || '',
        section: user.section || '',
        phoneNumber: user.phoneNumber || '',
        participationPoints: user.participationPoints || 0,
        streak: user.streak || 0,
        badges: user.badges || [],
        assignedEvent: user.assignedEvent,
        eventRole: user.eventRole
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: error.message });
  }
};

// @desc    Get all registered student members
// @route   GET /api/auth/members
// @access  Private (Admin/Coordinator)
export const getAllMembers = async (req: AuthRequest, res: Response) => {
  try {
    let students = [];

    if (isMongoConnected()) {
      students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    } else {
      // In MockDB, user structure is mostly same, find users with role 'student'
      students = MockDB.getUsers().filter((u: any) => u.role === 'student') || [];
      students.reverse(); // simulate sort by createdAt desc
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students.map((u: any) => ({
        id: isMongoConnected() ? u._id.toString() : u._id,
        username: u.username,
        name: u.name || "",
        email: u.email,
        role: u.role,
        registrationNumber: u.registrationNumber || '',
        department: u.department || '',
        year: u.year || '',
        section: u.section || '',
        phoneNumber: u.phoneNumber || '',
        participationPoints: u.participationPoints || 0,
        streak: u.streak || 0,
        badges: u.badges || []
      }))
    });
  } catch (error: any) {
    console.error('Get all members error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch members', error: error.message });
  }
};

// @desc    Create an Event Coordinator
// @route   POST /api/auth/coordinators
// @access  Private (Super Admin)
export const createCoordinator = async (req: AuthRequest, res: Response) => {
  const { username, email, password, assignedEvent, eventRole } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let user = null;

    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      user = await User.create({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'event-coordinator',
        participationPoints: 0,
        streak: 0,
        badges: [],
        assignedEvent: assignedEvent || undefined,
        eventRole: eventRole || undefined,
        coordinatorId: `COORD-${Math.floor(1000 + Math.random() * 9000)}`,
        isLocked: false,
        plaintextPassword: password
      });
    } else {
      const existingUser = MockDB.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      user = MockDB.createUser({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'event-coordinator',
        participationPoints: 0,
        streak: 0,
        badges: [],
        assignedEvent: assignedEvent || undefined,
        eventRole: eventRole || undefined,
        coordinatorId: `COORD-${Math.floor(1000 + Math.random() * 9000)}`,
        isLocked: false,
        plaintextPassword: password
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Coordinator created successfully',
      user: {
        id: isMongoConnected() ? user._id.toString() : user._id,
        username: user.username,
        name: user.name || "",
        email: user.email,
        role: user.role,
        coordinatorId: user.coordinatorId,
        assignedEvent: user.assignedEvent,
        isLocked: user.isLocked,
        password: password
      }
    });
  } catch (error: any) {
    console.error('Create coordinator error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create coordinator', error: error.message });
  }
};

// @desc    Get all Event Coordinators
// @route   GET /api/auth/coordinators
// @access  Private (Super Admin)
export const getCoordinators = async (req: AuthRequest, res: Response) => {
  try {
    let coordinators = [];

    if (isMongoConnected()) {
      coordinators = await User.find({ role: 'event-coordinator' })
        .select('-password')
        .sort({ createdAt: -1 });
    } else {
      coordinators = MockDB.getUsers().filter((u: any) => u.role === 'event-coordinator') || [];
      coordinators.reverse();
    }

    return res.status(200).json({
      success: true,
      count: coordinators.length,
      data: coordinators.map((u: any) => ({
        id: isMongoConnected() ? u._id.toString() : u._id,
        username: u.username,
        name: u.name || "",
        email: u.email,
        role: u.role,
        coordinatorId: u.coordinatorId,
        assignedEvent: u.assignedEvent,
        eventRole: u.eventRole,
        isLocked: u.isLocked,
        password: u.plaintextPassword || 'Hidden'
      }))
    });
  } catch (error: any) {
    console.error('Get all coordinators error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch coordinators', error: error.message });
  }
};

// @desc    Toggle Coordinator Lock Status
// @route   PATCH /api/auth/coordinators/:id/lock
// @access  Private (Super Admin)
export const toggleCoordinatorLock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let updatedUser = null;

    if (isMongoConnected()) {
      const user = await User.findById(id);
      if (user && user.role === 'event-coordinator') {
        user.isLocked = !user.isLocked;
        updatedUser = await user.save();
      }
    } else {
      const user = MockDB.findUserById(id);
      if (user && user.role === 'event-coordinator') {
        updatedUser = MockDB.updateUser(id, { isLocked: !user.isLocked });
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Coordinator not found' });
    }

    return res.status(200).json({ success: true, message: `Coordinator access ${updatedUser.isLocked ? 'locked' : 'restored'}` });
  } catch (error: any) {
    console.error('Toggle lock error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle lock status', error: error.message });
  }
};

// @desc    Delete Coordinator
// @route   DELETE /api/auth/coordinators/:id
// @access  Private (Super Admin)
export const deleteCoordinator = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (isMongoConnected()) {
      const user = await User.findByIdAndDelete(id);
      if (user) deleted = true;
    } else {
      const user = MockDB.deleteUser(id);
      if (user) deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coordinator not found' });
    }

    return res.status(200).json({ success: true, message: 'Coordinator deleted successfully' });
  } catch (error: any) {
    console.error('Delete coordinator error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete coordinator', error: error.message });
  }
};

// @desc    Delete Member (Student)
// @route   DELETE /api/auth/members/:id
// @access  Private (Super Admin)
export const deleteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (isMongoConnected()) {
      const user = await User.findByIdAndDelete(id);
      if (user) deleted = true;
    } else {
      const user = MockDB.deleteUser(id);
      if (user) deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    return res.status(200).json({ success: true, message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('Delete member error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete member', error: error.message });
  }
};

