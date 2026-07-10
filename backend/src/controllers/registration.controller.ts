import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { isMongoConnected } from '../config/db';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { MockDB } from '../services/db.service';
import { AuthRequest } from '../middlewares/auth';
import { emitRegistrationUpdate, emitAttendanceUpdate, emitNotification } from '../services/socket';
import { sendEmail, getRegistrationTemplate, getCancellationTemplate, getCertificateReadyTemplate } from '../services/email';
import { generateCertificatePDF } from '../services/pdf';

// @desc    Register a student for an event (One-Click Booking)
// @route   POST /api/registrations
// @access  Private (Student)
export const createRegistration = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.body;
  const studentId = req.user?.id;

  if (!eventId || !studentId) {
    return res.status(400).json({ success: false, message: 'Event ID is required' });
  }

  try {
    let event = null;
    let student = null;
    let existingReg = null;

    if (isMongoConnected()) {
      event = await Event.findById(eventId);
      student = await User.findById(studentId);
      existingReg = await Registration.findOne({ eventId, studentId });
    } else {
      event = MockDB.findEventById(eventId);
      student = MockDB.findUserById(studentId);
      existingReg = MockDB.getRegistrations().find(r => r.eventId === eventId && r.studentId === studentId);
    }

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (existingReg && existingReg.status !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'You have already registered for this event!' });
    }

    if (event.isRegistrationOpen === false) {
      return res.status(400).json({ success: false, message: 'Registration is closed for this event.' });
    }

    if (event.registrationDeadline && new Date(event.registrationDeadline).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed!' });
    }

    if (event.availableSeats <= 0) {
      return res.status(400).json({ success: false, message: 'Event is fully booked!' });
    }

    // Generate unique Registration ID
    const registrationId = `CH-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate Base64 QR Code representing the Registration ID
    const qrCodeUrl = await QRCode.toDataURL(registrationId, { margin: 1 });

    const registrationPayload = {
      registrationId,
      studentId,
      eventId,
      status: 'Approved',
      qrCodeUrl,
      attended: false
    };

    let registration = null;

    if (isMongoConnected()) {
      // Create registration
      const newReg = await Registration.create(registrationPayload);
      registration = await newReg.populate('eventId');
      
      // Update available seats in database
      await Event.findByIdAndUpdate(eventId, { $inc: { availableSeats: -1 } });
      
      // Award participation points (10 points for registering)
      await User.findByIdAndUpdate(studentId, { 
        $inc: { participationPoints: 10 } 
      });
    } else {
      let mockReg = MockDB.createRegistration(registrationPayload);
      // Clone it to avoid mutating the in-memory DB reference
      registration = { ...mockReg, eventId: event }; 
      
      const pts = (student.participationPoints || 0) + 10;
      MockDB.updateUser(studentId, { participationPoints: pts });
    }

    // Send confirmation email
    const emailHtml = getRegistrationTemplate(
      student.name,
      event.title,
      registrationId,
      event.date,
      event.time,
      event.venue
    );
    await sendEmail({
      to: student.email,
      subject: `Registration Confirmed: ${event.title}`,
      html: emailHtml
    });

    // Create system notification
    const notificationPayload = {
      userId: studentId,
      title: 'Registration Confirmed',
      message: `You have successfully registered for ${event.title}. Pass ID: ${registrationId}`,
      type: 'System'
    };

    if (isMongoConnected()) {
      // Standard mongoose notification (placeholder, we will create notifications route later)
    } else {
      MockDB.createNotification(notificationPayload);
    }

    // Broadcast real-time seats update
    const updatedSeats = Math.max(0, event.availableSeats - 1);
    const regCount = event.maxCapacity - updatedSeats;
    emitRegistrationUpdate(eventId, { availableSeats: updatedSeats, registrationCount: regCount });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: registration
    });
  } catch (error: any) {
    console.error('Create registration error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// @desc    Get registrations of logged-in student
// @route   GET /api/registrations/my
// @access  Private (Student)
export const getMyRegistrations = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.id;

  try {
    let registrations = [];

    if (isMongoConnected()) {
      registrations = await Registration.find({ studentId }).populate('eventId').sort({ createdAt: -1 });
    } else {
      registrations = MockDB.getRegistrations()
        .filter(r => r.studentId === studentId)
        .map(r => ({
          ...r,
          eventId: MockDB.findEventById(r.eventId)
        }));
      registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.status(200).json({ success: true, count: registrations.length, data: registrations });
  } catch (error: any) {
    console.error('Get my registrations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve registrations', error: error.message });
  }
};

// @desc    Get all registrations (Admin filter & search)
// @route   GET /api/registrations
// @access  Private (Admin / Coordinator)
export const getRegistrations = async (req: AuthRequest, res: Response) => {
  const { eventId, status, search } = req.query;

  try {
    let registrations: any[] = [];

    if (isMongoConnected()) {
      let query: any = {};

      if (eventId) query.eventId = eventId;
      if (status) query.status = status;

      registrations = await Registration.find(query)
        .populate('studentId')
        .populate('eventId')
        .sort({ createdAt: -1 });

      if (search) {
        const keyword = (search as string).toLowerCase();
        registrations = registrations.filter(r => 
          r.registrationId.toLowerCase().includes(keyword) ||
          r.studentId.name.toLowerCase().includes(keyword) ||
          r.studentId.email.toLowerCase().includes(keyword) ||
          r.studentId.registrationNumber?.toLowerCase().includes(keyword)
        );
      }
    } else {
      registrations = MockDB.getRegistrations().map(r => ({
        ...r,
        studentId: MockDB.findUserById(r.studentId),
        eventId: MockDB.findEventById(r.eventId)
      }));

      if (eventId) {
        registrations = registrations.filter(r => r.eventId?._id === eventId);
      }

      if (status) {
        registrations = registrations.filter(r => r.status === status);
      }

      if (search) {
        const keyword = (search as string).toLowerCase();
        registrations = registrations.filter(r => 
          r.registrationId.toLowerCase().includes(keyword) ||
          r.studentId?.name.toLowerCase().includes(keyword) ||
          r.studentId?.email.toLowerCase().includes(keyword) ||
          r.studentId?.registrationNumber?.toLowerCase().includes(keyword)
        );
      }
      registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.status(200).json({ success: true, count: registrations.length, data: registrations });
  } catch (error: any) {
    console.error('Get registrations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve registrations', error: error.message });
  }
};

// @desc    Admin Scan QR Code to Mark Attendance
// @route   POST /api/registrations/scan
// @access  Private (Admin / Coordinator)
export const scanAttendance = async (req: AuthRequest, res: Response) => {
  const { registrationId, eventId } = req.body;

  if (!registrationId) {
    return res.status(400).json({ success: false, message: 'Registration Pass ID, Name, or Reg No is required' });
  }

  try {
    let registration = null;
    let student = null;
    let event = null;

    if (isMongoConnected()) {
      registration = await Registration.findOne({ registrationId });
      
      if (!registration) {
        const students = await User.find({
          $or: [
            { name: { $regex: new RegExp(registrationId, 'i') } },
            { username: { $regex: new RegExp(registrationId, 'i') } },
            { registrationNumber: { $regex: new RegExp(registrationId, 'i') } }
          ]
        });

        if (students.length > 0) {
          const regQuery: any = {
            studentId: { $in: students.map(s => s._id) },
            status: 'Approved',
            attended: false
          };
          if (eventId) {
            regQuery.eventId = eventId;
          }
          
          registration = await Registration.findOne(regQuery).sort({ createdAt: -1 });
        }
      }

      if (registration) {
        student = await User.findById(registration.studentId);
        event = await Event.findById(registration.eventId);
      }
    } else {
      registration = MockDB.getRegistrations().find(r => r.registrationId === registrationId);
      
      if (!registration) {
        const keyword = registrationId.toLowerCase();
        const students = MockDB.getUsers().filter(u => 
          u.name?.toLowerCase().includes(keyword) || 
          u.username?.toLowerCase().includes(keyword) || 
          u.registrationNumber?.toLowerCase().includes(keyword)
        );

        if (students.length > 0) {
          const studentIds = students.map(s => s._id);
          const regs = MockDB.getRegistrations().filter(r => 
            studentIds.includes(r.studentId) && 
            r.status === 'Approved' && 
            r.attended === false &&
            (eventId ? r.eventId === eventId : true)
          );
          if (regs.length > 0) {
            regs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            registration = regs[0];
          }
        }
      }

      if (registration) {
        student = MockDB.findUserById(registration.studentId);
        event = MockDB.findEventById(registration.eventId);
      }
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    if (registration.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This registration has been cancelled.' });
    }

    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked!',
        studentName: student?.name,
        attendedAt: registration.attendedAt
      });
    }

    // Mark attendance
    const attendedAt = new Date();
    let updatedPoints = (student?.participationPoints || 0) + 50; // 50 points for attending
    let streak = (student?.streak || 0) + 1;
    let badges = [...(student?.badges || [])];

    // Award attendance-based badges
    if (streak === 1 && !badges.includes('First Event')) {
      badges.push('First Event');
    }
    if (streak === 3 && !badges.includes('Dedicated Attendee')) {
      badges.push('Dedicated Attendee');
    }
    if (updatedPoints >= 200 && !badges.includes('Bronze Medalist')) {
      badges.push('Bronze Medalist');
    }

    if (isMongoConnected()) {
      await Registration.findByIdAndUpdate(registration._id, {
        attended: true,
        attendedAt
      });
      await User.findByIdAndUpdate(student._id, {
        participationPoints: updatedPoints,
        streak,
        badges
      });
    } else {
      MockDB.updateRegistration(registration._id, {
        attended: true,
        attendedAt: attendedAt.toISOString()
      });
      MockDB.updateUser(student._id, {
        participationPoints: updatedPoints,
        streak,
        badges
      });
    }

    // Trigger Notification for Certificate Ready
    const notifPayload = {
      userId: student._id.toString(),
      title: 'Certificate Generated!',
      message: `Your participation certificate for "${event.title}" is ready to download.`,
      type: 'Certificate'
    };

    if (isMongoConnected()) {
      // Create notification in DB
    } else {
      MockDB.createNotification(notifPayload);
    }
    emitNotification(student._id.toString(), notifPayload);

    // Send certificate email alert
    const certEmailHtml = getCertificateReadyTemplate(student.name, event.title);
    await sendEmail({
      to: student.email,
      subject: `Certificate Ready: ${event.title}`,
      html: certEmailHtml
    });

    // Fetch updated attendance stats for live broadcast
    let attendedCount = 0;
    if (isMongoConnected()) {
      attendedCount = await Registration.countDocuments({ eventId: event._id, attended: true });
    } else {
      attendedCount = MockDB.getRegistrations().filter(r => r.eventId === event._id && r.attended).length;
    }

    emitAttendanceUpdate(event._id.toString(), {
      attendedCount,
      remainingCapacity: Math.max(0, event.availableSeats)
    });

    return res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${student?.name}!`,
      studentName: student?.name,
      registrationNumber: student?.registrationNumber,
      department: student?.department,
      participationPoints: updatedPoints,
      streak,
      badges
    });
  } catch (error: any) {
    console.error('Scan attendance error:', error);
    return res.status(500).json({ success: false, message: 'Scan failed', error: error.message });
  }
};

// @desc    Admin manually approve, reject, or cancel registration
// @route   PATCH /api/registrations/:id
// @access  Private (Admin / Coordinator)
export const updateRegistrationStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Approved', 'Rejected', 'Cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid status is required' });
  }

  try {
    let registration = null;
    let student = null;
    let event = null;

    if (isMongoConnected()) {
      registration = await Registration.findById(id);
    } else {
      registration = MockDB.findRegistrationById(id);
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (isMongoConnected()) {
      student = await User.findById(registration.studentId);
      event = await Event.findById(registration.eventId);
    } else {
      student = MockDB.findUserById(registration.studentId);
      event = MockDB.findEventById(registration.eventId);
    }

    // If changing from Approved to Cancelled, return seat
    if (registration.status === 'Approved' && status === 'Cancelled') {
      if (isMongoConnected()) {
        await Event.findByIdAndUpdate(registration.eventId, { $inc: { availableSeats: 1 } });
      } else {
        const currentSeats = event.availableSeats || 0;
        MockDB.updateEvent(event._id, { availableSeats: currentSeats + 1 });
      }

      // Send cancellation email
      const cancelHtml = getCancellationTemplate(student.name, event.title);
      await sendEmail({
        to: student.email,
        subject: `Registration Cancelled: ${event.title}`,
        html: cancelHtml
      });
    }

    // Update status
    let updatedReg = null;
    if (isMongoConnected()) {
      updatedReg = await Registration.findByIdAndUpdate(id, { status }, { new: true });
    } else {
      updatedReg = MockDB.updateRegistration(id, { status });
    }

    // Broadcast seats adjustment
    const seatChange = (isMongoConnected() ? await Event.findById(registration.eventId) : MockDB.findEventById(registration.eventId));
    const availSeats = seatChange.availableSeats;
    const regCount = seatChange.maxCapacity - availSeats;
    emitRegistrationUpdate(registration.eventId.toString(), { availableSeats: availSeats, registrationCount: regCount });

    return res.status(200).json({
      success: true,
      message: `Registration status updated to ${status}`,
      data: updatedReg
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// @desc    Admin manually delete a registration
// @route   DELETE /api/registrations/:id
// @access  Private (Admin / Coordinator)
export const deleteRegistration = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    let deletedReg = null;

    if (isMongoConnected()) {
      const reg = await Registration.findById(id);
      if (reg) {
        if (reg.status !== 'Cancelled') {
           await Event.findByIdAndUpdate(reg.eventId, { $inc: { availableSeats: 1 } });
        }
        deletedReg = await Registration.findByIdAndDelete(id);
      }
    } else {
      deletedReg = MockDB.deleteRegistration(id);
    }

    if (!deletedReg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Broadcast seats adjustment
    const seatChange = (isMongoConnected() ? await Event.findById(deletedReg.eventId) : MockDB.findEventById(deletedReg.eventId));
    if (seatChange) {
      const availSeats = seatChange.availableSeats;
      const regCount = seatChange.maxCapacity - availSeats;
      emitRegistrationUpdate(deletedReg.eventId.toString(), { availableSeats: availSeats, registrationCount: regCount });
    }

    return res.status(200).json({
      success: true,
      message: 'Registration deleted successfully',
      data: deletedReg
    });
  } catch (error: any) {
    console.error('Delete registration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete registration', error: error.message });
  }
};

// @desc    Submit Feedback and Star Rating for attended events
// @route   POST /api/registrations/:id/feedback
// @access  Private (Student)
export const submitFeedback = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment, suggestions } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Star rating (1-5) is required' });
  }

  try {
    let registration = null;

    if (isMongoConnected()) {
      registration = await Registration.findById(id);
    } else {
      registration = MockDB.findRegistrationById(id);
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration details not found' });
    }

    if (registration.studentId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'You can only submit feedback for your own passes' });
    }

    if (!registration.attended) {
      return res.status(400).json({ success: false, message: 'You can only submit feedback after attending the event!' });
    }

    const feedbackPayload = {
      rating,
      comment: comment || '',
      suggestions: suggestions || '',
      submittedAt: new Date()
    };

    let updatedReg = null;
    if (isMongoConnected()) {
      updatedReg = await Registration.findByIdAndUpdate(id, { feedback: feedbackPayload }, { new: true });
    } else {
      updatedReg = MockDB.updateRegistration(id, { feedback: feedbackPayload });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully! Thank you.',
      data: updatedReg
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ success: false, message: 'Feedback submission failed', error: error.message });
  }
};

// @desc    Download verified participation certificate (Generates PDF response)
// @route   GET /api/registrations/:id/certificate
// @access  Public (Verification needs to be public, but downloading pass is for user)
export const downloadCertificate = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let registration = null;
    let student = null;
    let event = null;

    if (isMongoConnected()) {
      registration = await Registration.findById(id);
      if (registration) {
        student = await User.findById(registration.studentId);
        event = await Event.findById(registration.eventId);
      }
    } else {
      registration = MockDB.findRegistrationById(id);
      if (registration) {
        student = MockDB.findUserById(registration.studentId);
        event = MockDB.findEventById(registration.eventId);
      }
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Certificate registration record not found' });
    }

    if (!registration.attended) {
      return res.status(400).json({ success: false, message: 'Certificate is only available for attended participants.' });
    }

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${registration.registrationId}.pdf`);

    // Check if participant is a winner
    let isWinner = false;
    let place = '';
    
    if (event.winners && event.winners.length > 0) {
      const normalize = (str: string | undefined) => str?.toString().toLowerCase().trim() || '';
      const sUser = normalize(student.username);
      const sReg = normalize(student.registrationNumber);

      const winnerMatch = event.winners.find((w: any) => {
        const wUser = normalize(w.username);
        const wReg = normalize(w.regNo);
        
        return (wUser && wUser === sUser) || 
               (wReg && wReg === sReg) || 
               (wReg && wReg === sUser) || 
               (wUser && wUser === sReg);
      });
      
      if (winnerMatch) {
        isWinner = true;
        place = winnerMatch.place;
      }
    }

    // Stream PDF directly
    await generateCertificatePDF(res, {
      studentName: student.name || 'Participant',
      registrationNumber: student.registrationNumber || 'N/A',
      department: student.department || 'N/A',
      eventTitle: event.title,
      eventCategory: event.category,
      eventDate: event.date,
      registrationId: registration.registrationId,
      isWinner,
      place
    });

  } catch (error: any) {
    console.error('Download certificate error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Failed to generate certificate PDF', error: error.message });
    }
  }
};

// @desc    Public verification page lookup
// @route   GET /api/registrations/verify/:regId
// @access  Public
export const verifyCertificate = async (req: Request, res: Response) => {
  const { regId } = req.params;

  try {
    let registration = null;
    let student = null;
    let event = null;

    if (isMongoConnected()) {
      registration = await Registration.findOne({ registrationId: regId });
      if (registration) {
        student = await User.findById(registration.studentId).select('name registrationNumber department');
        event = await Event.findById(registration.eventId).select('title category date venue');
      }
    } else {
      registration = MockDB.getRegistrations().find(r => r.registrationId === regId);
      if (registration) {
        student = MockDB.findUserById(registration.studentId);
        event = MockDB.findEventById(registration.eventId);
      }
    }

    if (!registration || !registration.attended) {
      return res.status(404).json({
        success: false,
        message: 'No verified certificate found matching this registration ID.'
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      data: {
        registrationId: registration.registrationId,
        attendedAt: registration.attendedAt,
        student: {
          name: student.name,
          registrationNumber: student.registrationNumber,
          department: student.department
        },
        event: {
          title: event.title,
          category: event.category,
          date: event.date,
          venue: event.venue
        }
      }
    });
  } catch (error: any) {
    console.error('Verify certificate error:', error);
    return res.status(500).json({ success: false, message: 'Verification lookup failed', error: error.message });
  }
};

// @desc    Retrieve Administrator Dashboard Statistics
// @route   GET /api/registrations/dashboard-stats
// @access  Private (Admin / Coordinator)
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    let totalStudents = 0;
    let totalEvents = 0;
    let totalRegistrations = 0;
    let attendedCount = 0;
    let departmentBreakdown: any = {};
    let registrationsByDay: any = {};

    if (isMongoConnected()) {
      totalStudents = await User.countDocuments({ role: 'student' });
      totalEvents = await Event.countDocuments({});
      totalRegistrations = await Registration.countDocuments({});
      attendedCount = await Registration.countDocuments({ attended: true });

      const allUsers = await User.find({ role: 'student' });
      allUsers.forEach(u => {
        if (u.department) {
          departmentBreakdown[u.department] = (departmentBreakdown[u.department] || 0) + 1;
        }
      });

      const allRegs = await Registration.find({});
      allRegs.forEach(r => {
        const day = new Date(r.createdAt).toISOString().split('T')[0];
        registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
      });
    } else {
      const students = MockDB.getUsers().filter(u => u.role === 'student');
      totalStudents = students.length;
      totalEvents = MockDB.getEvents().length;
      const regs = MockDB.getRegistrations();
      totalRegistrations = regs.length;
      attendedCount = regs.filter(r => r.attended).length;

      students.forEach(u => {
        if (u.department) {
          departmentBreakdown[u.department] = (departmentBreakdown[u.department] || 0) + 1;
        }
      });

      regs.forEach(r => {
        const day = new Date(r.createdAt).toISOString().split('T')[0];
        registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
      });
    }

    const attendancePercentage = totalRegistrations > 0 
      ? Math.round((attendedCount / totalRegistrations) * 100) 
      : 0;

    // Format daily trend for Recharts [{ day: '2026-07-01', count: 12 }]
    const registrationTrend = Object.keys(registrationsByDay).map(day => ({
      day,
      count: registrationsByDay[day]
    })).sort((a, b) => a.day.localeCompare(b.day));

    // Format department breakdown [{ name: 'CS', value: 45 }]
    const departmentStats = Object.keys(departmentBreakdown).map(dept => ({
      name: dept,
      value: departmentBreakdown[dept]
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalEvents,
        totalRegistrations,
        attendancePercentage,
        registrationTrend,
        departmentStats
      }
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stats', error: error.message });
  }
};

// @desc    Admin Bulk Verify Attendance & Generate Certificates for all approved event signups
// @route   POST /api/registrations/bulk-verify
// @access  Private (Admin / Coordinator)
export const bulkVerifyAttendance = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'Event ID is required' });
  }

  try {
    let registrations: any[] = [];
    let event: any = null;

    if (isMongoConnected()) {
      event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      registrations = await Registration.find({ eventId, status: 'Approved', attended: false }).populate('studentId');
    } else {
      event = MockDB.findEventById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      registrations = MockDB.getRegistrations()
        .filter(r => r.eventId === eventId && r.status === 'Approved' && !r.attended)
        .map(r => ({
          ...r,
          studentId: MockDB.findUserById(r.studentId)
        }));
    }

    if (registrations.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No pending approvals/attendance records require certificate generation for this event.',
        count: 0 
      });
    }

    const attendedAt = new Date();
    let verifyCount = 0;

    for (const reg of registrations) {
      const student = reg.studentId;
      if (!student) continue;

      let updatedPoints = (student.participationPoints || 0) + 50;
      let streak = (student.streak || 0) + 1;
      let badges = [...(student.badges || [])];

      if (streak === 1 && !badges.includes('First Event')) {
        badges.push('First Event');
      }
      if (streak === 3 && !badges.includes('Dedicated Attendee')) {
        badges.push('Dedicated Attendee');
      }
      if (updatedPoints >= 200 && !badges.includes('Bronze Medalist')) {
        badges.push('Bronze Medalist');
      }

      if (isMongoConnected()) {
        await Registration.findByIdAndUpdate(reg._id, {
          attended: true,
          attendedAt,
          certificateIssued: true
        });
        await User.findByIdAndUpdate(student._id, {
          participationPoints: updatedPoints,
          streak,
          badges
        });
      } else {
        MockDB.updateRegistration(reg._id, {
          attended: true,
          attendedAt: attendedAt.toISOString(),
          certificateIssued: true
        });
        MockDB.updateUser(student._id, {
          participationPoints: updatedPoints,
          streak,
          badges
        });
      }

      // Create notification
      const notifPayload = {
        userId: student._id.toString(),
        title: 'Certificate Generated!',
        message: `Your participation certificate for "${event.title}" is ready to download.`,
        type: 'Certificate'
      };

      if (!isMongoConnected()) {
        MockDB.createNotification(notifPayload);
      }
      emitNotification(student._id.toString(), notifPayload);

      // Email certificate Ready
      const certEmailHtml = getCertificateReadyTemplate(student.name, event.title);
      await sendEmail({
        to: student.email,
        subject: `Certificate Ready: ${event.title}`,
        html: certEmailHtml
      });

      verifyCount++;
    }

    // Broadcast attendance update via socket
    let totalAttendedCount = 0;
    if (isMongoConnected()) {
      totalAttendedCount = await Registration.countDocuments({ eventId: event._id, attended: true });
    } else {
      totalAttendedCount = MockDB.getRegistrations().filter(r => r.eventId === eventId && r.attended).length;
    }

    emitAttendanceUpdate(event._id.toString(), {
      attendedCount: totalAttendedCount,
      remainingCapacity: Math.max(0, event.availableSeats)
    });

    return res.status(200).json({
      success: true,
      message: `Successfully verified attendance and distributed certificates to ${verifyCount} students!`,
      count: verifyCount
    });
  } catch (error: any) {
    console.error('Bulk verify attendance error:', error);
    return res.status(500).json({ success: false, message: 'Bulk verification failed', error: error.message });
  }
};

// @desc    Admin issue certificate for a single registration
// @route   PATCH /api/registrations/:id/issue
// @access  Private (Admin / Coordinator)
export const issueCertificate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    let registration = null;
    let student = null;
    let event = null;

    if (isMongoConnected()) {
      registration = await Registration.findById(id);
      if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
      student = await User.findById(registration.studentId);
      event = await Event.findById(registration.eventId);
    } else {
      registration = MockDB.findRegistrationById(id);
      if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
      student = MockDB.findUserById(registration.studentId);
      event = MockDB.findEventById(registration.eventId);
    }

    if (!student || !event) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    if (!registration.attended) {
      return res.status(400).json({ success: false, message: 'Cannot issue certificate. Student has not attended the event.' });
    }

    if (isMongoConnected()) {
      await Registration.findByIdAndUpdate(id, { certificateIssued: true });
    } else {
      MockDB.updateRegistration(id, { certificateIssued: true });
    }

    // Create notification
    const notifPayload = {
      userId: student._id.toString(),
      title: 'Certificate Generated!',
      message: `Your participation certificate for "${event.title}" is ready to download.`,
      type: 'Certificate'
    };

    if (!isMongoConnected()) {
      MockDB.createNotification(notifPayload);
    }
    emitNotification(student._id.toString(), notifPayload);

    // Email certificate Ready
    const certEmailHtml = getCertificateReadyTemplate(student.name, event.title);
    await sendEmail({
      to: student.email,
      subject: `Certificate Ready: ${event.title}`,
      html: certEmailHtml
    });

    return res.status(200).json({ success: true, message: 'Certificate issued successfully' });
  } catch (error: any) {
    console.error('Issue certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to issue certificate', error: error.message });
  }
};
