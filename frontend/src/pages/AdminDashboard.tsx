import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { SpotlightCard } from '../components/SpotlightCard';
import { Loader } from '../components/Loader';
import { 
  Users, Calendar, CheckSquare, ShieldCheck, Megaphone, Plus, Trash2, Edit3, 
  Copy, FolderPlus, Download, Search, Check, X, Camera, Scan, Award, AlertTriangle, LogOut, Trophy, ClipboardCheck, Keyboard, User, MessageSquare, Clock, CheckCircle2, Home, Loader2, ArrowUpRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import confetti from 'canvas-confetti';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'registrations' | 'scanner' | 'certificates' | 'winners' | 'members' | 'coordinators' | 'profile' | 'announcements' | 'support'>(
    user?.role === 'super-admin' ? 'overview' : 'events'
  );
  
  // Real-time Event activity logs
  const [activityFeed, setActivityFeed] = useState<string[]>([
    'System initialization successful.',
    'Admin dashboard loaded.',
  ]);

  // QR Attendance check-in scan state
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannerEventId, setScannerEventId] = useState('');
  const [showScannerAutocomplete, setShowScannerAutocomplete] = useState(false);

  // Winner Announcement State
  const [winner1st, setWinner1st] = useState({ username: '', regNo: '', year: '' });
  const [winner2nd, setWinner2nd] = useState({ username: '', regNo: '', year: '' });
  const [winner3rd, setWinner3rd] = useState({ username: '', regNo: '', year: '' });
  const [isWinnersPublished, setIsWinnersPublished] = useState(false);

  // Profile Dropdown State
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // New Event Forms State
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Event details payload state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCategory, setEventCategory] = useState('Technical');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('09:00 AM');
  const [eventVenue, setEventVenue] = useState('');
  const [eventExternalLink, setEventExternalLink] = useState('');
  const [eventCapacity, setEventCapacity] = useState(100);
  const [eventDeadline, setEventDeadline] = useState('');
  const [eventLevel, setEventLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [eventPrize, setEventPrize] = useState('First Place Trophy');
  const [eventRules, setEventRules] = useState('Teams of 2-4. Original code only.');
  
  const [coordinatorName, setCoordinatorName] = useState('Dr. Rajesh Kumar');
  const [coordinatorEmail, setCoordinatorEmail] = useState('rajesh.kumar@campushub.edu');
  const [coordinatorPhone, setCoordinatorPhone] = useState('9988776655');

  // Announcement State
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', category: 'General', eventId: '' });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [studentCoordinatorName, setStudentCoordinatorName] = useState('Student Admin');
  const [studentCoordinatorEmail, setStudentCoordinatorEmail] = useState('student.admin@srm.edu');
  const [studentCoordinatorPhone, setStudentCoordinatorPhone] = useState('9876543210');
  const [eventRegistrationOpen, setEventRegistrationOpen] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  // ── Certificate Manager State ──
  const [certSelectedEventId, setCertSelectedEventId] = useState<string>('');
  const [certPreviewReg, setCertPreviewReg] = useState<any | null>(null);

  // Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/registrations/dashboard-stats');
      return res.data.data;
    }
  });

  // Fetch Admin Events list
  const { data: adminEvents } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const res = await api.get('/events');
      return res.data.data;
    }
  });

  // Fetch Registrations Table List
  const { data: allRegistrations } = useQuery({
    queryKey: ['admin-registrations', searchQuery, statusFilter],
    queryFn: async () => {
      const res = await api.get(`/registrations?status=${statusFilter}&search=${searchQuery}`);
      return res.data.data;
    }
  });

  // Fetch registrations for scanner autocomplete
  const { data: scannerRegistrations } = useQuery({
    queryKey: ['scanner-registrations', scannerEventId],
    queryFn: async () => {
      if (!scannerEventId) return [];
      const res = await api.get(`/registrations?eventId=${scannerEventId}&status=Approved`);
      return res.data.data;
    },
    enabled: !!scannerEventId
  });

  // Fetch All Registered Members
  const { data: allMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['admin-members'],
    queryFn: async () => {
      const res = await api.get('/auth/members');
      return res.data.data;
    },
    enabled: user?.role === 'super-admin'
  });
  
  const [memberYearFilter, setMemberYearFilter] = useState('');

  // Fetch All Coordinators
  const { data: allCoordinators, isLoading: coordinatorsLoading } = useQuery({
    queryKey: ['admin-coordinators'],
    queryFn: async () => {
      const res = await api.get('/auth/coordinators');
      return res.data.data;
    },
    enabled: user?.role === 'super-admin'
  });

  // Fetch Announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data.data;
    }
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => api.post('/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      alert('Announcement created successfully');
    }
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => api.put(`/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      alert('Announcement updated successfully');
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      alert('Announcement deleted successfully');
    }
  });

  // Fetch Support Tickets
  const { data: supportTickets, isLoading: supportTicketsLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const res = await api.get('/support');
      return res.data.data;
    }
  });

  const updateSupportTicketMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await api.patch(`/support/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    }
  });

  const deleteSupportTicketMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/support/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    }
  });

  const createCoordinatorMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/auth/coordinators', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coordinators'] });
      // Reset form handled locally
    }
  });

  const toggleCoordinatorLockMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/auth/coordinators/${id}/lock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coordinators'] });
    }
  });

  const deleteCoordinatorMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/auth/coordinators/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coordinators'] });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/auth/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      alert('Member account deleted successfully.');
    }
  });

  // Real-time listener for updates
  useEffect(() => {
    if (!socket) return;

    socket.on('global_dashboard_update', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      setActivityFeed((prev) => [`Live Update: Event registration metrics synchronized.`, ...prev]);
    });

    return () => {
      socket.off('global_dashboard_update');
    };
  }, [socket]);

  // Load existing winners when selecting an event in Certificate Manager
  useEffect(() => {
    if (certSelectedEventId && adminEvents) {
      const selected = adminEvents.find((e: any) => e._id === certSelectedEventId);
      if (selected && selected.winners && selected.winners.length > 0) {
        const w1 = selected.winners.find((w: any) => w.place === '1st');
        const w2 = selected.winners.find((w: any) => w.place === '2nd');
        const w3 = selected.winners.find((w: any) => w.place === '3rd');
        if (w1) setWinner1st({ username: w1.username, regNo: w1.regNo, year: w1.year });
        if (w2) setWinner2nd({ username: w2.username, regNo: w2.regNo, year: w2.year });
        if (w3) setWinner3rd({ username: w3.username, regNo: w3.regNo, year: w3.year });
        setIsWinnersPublished(true);
      } else {
        setWinner1st({ username: '', regNo: '', year: '' });
        setWinner2nd({ username: '', regNo: '', year: '' });
        setWinner3rd({ username: '', regNo: '', year: '' });
        setIsWinnersPublished(false);
      }
    } else {
      setIsWinnersPublished(false);
    }
  }, [certSelectedEventId, adminEvents]);

  // Create or Edit Event mutation
  const saveEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingEventId) {
        return api.put(`/events/${editingEventId}`, payload);
      } else {
        return api.post('/events', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      resetEventForm();
      alert('Event saved successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save event details.');
    }
  });

  // Duplicate Event mutation
  const duplicateMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await api.post(`/events/${eventId}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      alert('Event duplicated successfully as Draft!');
    }
  });

  // Delete Event mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await api.delete(`/events/${eventId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      alert('Event deleted successfully.');
    }
  });

  // Approve/Reject/Cancel pass mutation
  const updatePassStatusMutation = useMutation({
    mutationFn: async (payload: { id: string, status: string }) => {
      const res = await api.patch(`/registrations/${payload.id}`, { status: payload.status });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      alert('Pass status updated successfully.');
    }
  });

  // Issue single certificate mutation
  const issueCertificateMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const res = await api.patch(`/registrations/${registrationId}/issue`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    }
  });

  // Toggle Registration Open/Close mutation
  const toggleRegistrationMutation = useMutation({
    mutationFn: async (payload: { id: string, isOpen: boolean }) => {
      const res = await api.put(`/events/${payload.id}`, { isRegistrationOpen: payload.isOpen });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update registration status.');
    }
  });

  // Announce Event Winners mutation
  const announceWinnersMutation = useMutation({
    mutationFn: async (payload: { title: string, content: string, eventId: string, winners: any[] }) => {
      const res = await api.post(`/events/${payload.eventId}/winners`, {
        title: payload.title,
        content: payload.content,
        winners: payload.winners
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      alert('Winners announced and broadcasted successfully in real-time!');
      setWinner1st({ username: '', regNo: '', year: '' });
      setWinner2nd({ username: '', regNo: '', year: '' });
      setWinner3rd({ username: '', regNo: '', year: '' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to announce winners.');
    }
  });

  const handleDeleteRegistration = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) return;
    try {
      const res = await api.delete(`/registrations/${id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete registration');
    }
  };

  // Bulk Verify Attendance & Distribute Certificates mutation
  const bulkVerifyMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await api.post('/registrations/bulk-verify', { eventId });
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      alert(data.message || 'Certificates distributed to all attendees successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to distribute certificates.');
    }
  });

  const filteredScannerStudents = useMemo(() => {
    if (!scannerEventId || !scanCode || scanCode.length < 2) return [];
    const query = scanCode.toLowerCase();
    return scannerRegistrations?.filter((r: any) => 
      !r.attended &&
      (
        r.studentId?.name?.toLowerCase().includes(query) ||
        r.studentId?.username?.toLowerCase().includes(query) ||
        r.studentId?.registrationNumber?.toLowerCase().includes(query) ||
        r.registrationId.toLowerCase().includes(query)
      )
    ) || [];
  }, [scanCode, scannerEventId, scannerRegistrations]);

  // Execute QR Scan Check-In
  const triggerCheckInScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode) return;
    setScanLoading(true);
    setScanResult(null);
    setScanError(null);
    
    try {
      const res = await api.post('/registrations/scan', { 
        registrationId: scanCode,
        eventId: scannerEventId || undefined 
      });
      if (res.data.success) {
        setScanResult(res.data);
        confetti({ particleCount: 80, spread: 60, colors: ['#6366f1', '#06b6d4'] });
      }
    } catch (err: any) {
      setScanError(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleEditClick = (event: any) => {
    setEditingEventId(event._id);
    setEventTitle(event.title);
    setEventDesc(event.description);
    setEventCategory(event.category);
    setEventDate(event.date);
    setEventTime(event.time);
    setEventVenue(event.venue);
    setEventExternalLink(event.externalLink || '');
    setEventCapacity(event.maxCapacity);
    setEventDeadline(new Date(event.registrationDeadline).toISOString().split('T')[0]);
    setEventLevel(event.difficultyLevel);
    setEventPrize(event.prizeDetails);
    setEventRules(event.rules.join('\n'));
    setCoordinatorName(event.facultyCoordinator?.name || event.facultyCoordinator?.username);
    setCoordinatorEmail(event.facultyCoordinator?.email);
    setCoordinatorPhone(event.facultyCoordinator?.phone);
    setStudentCoordinatorName(event.studentCoordinator?.name || event.studentCoordinator?.username);
    setStudentCoordinatorEmail(event.studentCoordinator?.email);
    setStudentCoordinatorPhone(event.studentCoordinator?.phone);
    setEventRegistrationOpen(event.isRegistrationOpen !== false);
    setShowEventForm(true);
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDesc('');
    setEventCategory('Technical');
    setEventDate('');
    setEventTime('09:00 AM');
    setEventVenue('');
    setEventExternalLink('');
    setEventCapacity(100);
    setEventDeadline('');
    setEventLevel('Beginner');
    setEventPrize('');
    setEventRules('');
    setEventRegistrationOpen(true);
    setShowEventForm(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEventMutation.mutate({
      title: eventTitle,
      description: eventDesc,
      category: eventCategory,
      date: eventDate,
      time: eventTime,
      venue: eventVenue,
      externalLink: eventExternalLink,
      maxCapacity: eventCapacity,
      registrationDeadline: new Date(eventDeadline),
      difficultyLevel: eventLevel,
      prizeDetails: eventPrize,
      rules: eventRules.split('\n').filter(r => r.trim() !== ''),
      requirements: ['Bring college ID card.'],
      facultyCoordinator: { name: coordinatorName, email: coordinatorEmail, phone: coordinatorPhone },
      studentCoordinator: { name: studentCoordinatorName, email: studentCoordinatorEmail, phone: studentCoordinatorPhone },
      isPublished: true, // Auto-publish for dashboard simplicity
      isRegistrationOpen: eventRegistrationOpen
    });
  };

  // CSV Exporter for registrations list
  const exportToCSV = () => {
    const listToExport = allRegistrations?.filter((r: any) => eventFilter === '' ? true : r.eventId?._id === eventFilter);
    if (!listToExport || listToExport.length === 0) return;
    
    const headers = 'Pass ID,Student Name,Email,Department,Event,Date,Status,Checked-In\n';
    const rows = listToExport.map((r: any) => 
      `"${r.registrationId}","${r.studentId?.name || r.studentId?.username || 'N/A'}","${r.studentId?.email || 'N/A'}","${r.studentId?.department || 'N/A'}","${r.eventId?.title || 'N/A'}","${r.eventId?.date || 'N/A'}","${r.status}","${r.attended ? 'Yes' : 'No'}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `CampusHub_Registrations_${Date.now()}.csv`);
    a.click();
  };

  const COLORS = ['#14b8a6', '#6366f1', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header bar */}
      <header className="print:hidden h-16 border-b border-border/50 shadow-sm bg-background/95 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          title="Return to Landing Page"
        >
          <img src="/gtec_logo.png" alt="GTEC Logo" className="w-7 h-7 object-contain rounded-md" />
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm tracking-tight leading-none">Information Technology</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              {user?.role === 'super-admin' ? 'Administration' : user?.role === 'event-coordinator' ? 'Coordinator Portal' : 'Volunteer Portal'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1.5 md:pl-3 md:pr-1.5 rounded-full bg-muted/50 border border-white/10 hover:bg-white/10 transition clickable"
            >
              <span className="text-xs font-bold text-foreground hidden sm:block">{user?.username}</span>
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30">
                {(user?.username || 'A').charAt(0).toUpperCase()}
              </div>
            </button>
            
            {showProfileDropdown && (
              <div className="absolute right-0 mt-3 w-48 bg-card border border-muted shadow-2xl rounded-2xl overflow-hidden z-50">
                <button
                  onClick={() => { setShowProfileDropdown(false); setActiveTab('profile'); }}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-foreground hover:bg-muted/50 transition flex items-center gap-2"
                >
                  <User className="w-4 h-4" /> My Profile
                </button>
                <div className="h-px bg-border/50 w-full" />
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-destructive hover:bg-destructive/10 transition flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="print:hidden flex-1 flex flex-col md:flex-row relative">
        {/* Navigation Sidebar / Bottom Bar */}
        <aside className="md:w-60 border-t md:border-t-0 md:border-r border-white/5 md:p-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:z-50 max-md:bg-background max-md:border-t max-md:border-border/50 max-md:justify-around no-scrollbar md:shadow-none pb-safe max-md:px-1 max-md:py-1">
          {[
            { id: 'overview', label: 'Home', icon: Home, adminOnly: true },
            { id: 'events', label: 'Manage Events', icon: Calendar },
            { id: 'registrations', label: 'Registered Events', icon: CheckSquare },
            { id: 'scanner', label: 'Attendance Check-in', icon: ClipboardCheck },
            { id: 'winners', label: 'Winners & Certificates', icon: Trophy, hideOnMobile: true },
            { id: 'announcements', label: 'Manage Announcements', icon: Megaphone, adminOnly: true, hideOnMobile: true },
            { id: 'support', label: 'Support Tickets', icon: AlertTriangle, adminOnly: true, hideOnMobile: true },
            { id: 'members', label: 'Registered Accounts', icon: Users, adminOnly: true },
            { id: 'coordinators', label: 'Manage Coordinators', icon: ShieldCheck, adminOnly: true, hideOnMobile: true }
          ].filter(tab => !tab.adminOnly || user?.role === 'super-admin').map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 md:py-2 md:px-4 text-center font-semibold flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 transition-all flex-1 md:flex-none min-w-0 md:mb-1 md:rounded-xl rounded-lg ${
                  isActive
                    ? 'max-md:text-primary md:bg-primary md:text-primary-foreground md:shadow-md md:shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                } ${(tab as any).hideOnMobile ? 'max-md:hidden' : ''}`}
              >
                <div className={`flex items-center justify-center transition-all ${isActive ? 'max-md:bg-primary/15 max-md:w-14 max-md:h-8 max-md:rounded-full' : 'max-md:w-8 max-md:h-8'}`}>
                  <Icon className={`shrink-0 transition-all ${isActive ? 'w-5 h-5 md:w-4 md:h-4' : 'w-6 h-6 md:w-4 md:h-4 opacity-70'}`} />
                </div>
                <span className={`truncate text-[10px] md:text-xs leading-tight transition-all duration-300 ${isActive ? 'max-md:block max-md:font-bold' : 'max-md:hidden'} md:block`}>
                  {tab.label.replace(' & Certificates', '').replace('Manage ', '').replace(' Check-in', '')}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Dashboard Panels */}
        <main className="flex-1 p-3 md:p-6 max-md:pb-24 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* PANEL 1: ANALYTICS OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {statsLoading ? (
                <div className="text-center py-6"><Loader /></div>
              ) : !stats ? (
                <p className="text-xs text-muted-foreground">Failed to calculate metrics.</p>
              ) : (
                <>
                  {/* Stats card counters */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <SpotlightCard className="p-5 glassmorphism-card border border-secondary/20 hover:border-secondary/50 transition-all hover:-translate-y-1" glowColor="rgba(6, 182, 212, 0.25)">
                      <Users className="w-6 h-6 text-secondary mb-2" />
                      <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Total Students</span>
                      <h4 className="text-3xl font-display font-black text-foreground mt-0.5">{stats.totalStudents}</h4>
                    </SpotlightCard>

                    <SpotlightCard className="p-5 glassmorphism-card border border-primary/20 hover:border-primary/50 transition-all hover:-translate-y-1" glowColor="rgba(139, 92, 246, 0.25)">
                      <Calendar className="w-6 h-6 text-primary mb-2" />
                      <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Total Events</span>
                      <h4 className="text-3xl font-display font-black text-foreground mt-0.5">{stats.totalEvents}</h4>
                    </SpotlightCard>

                    <SpotlightCard className="p-5 glassmorphism-card border border-accent/20 hover:border-accent/50 transition-all hover:-translate-y-1" glowColor="rgba(236, 72, 153, 0.25)">
                      <CheckSquare className="w-6 h-6 text-accent mb-2" />
                      <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Today's Bookings</span>
                      <h4 className="text-3xl font-display font-black text-foreground mt-0.5">{stats.totalRegistrations}</h4>
                    </SpotlightCard>

                    <SpotlightCard className="p-5 glassmorphism-card border border-emerald-500/20 hover:border-emerald-500/50 transition-all hover:-translate-y-1" glowColor="rgba(16, 185, 129, 0.25)">
                      <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                      <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Checked-In %</span>
                      <h4 className="text-3xl font-display font-black text-foreground mt-0.5">{stats.attendancePercentage}%</h4>
                    </SpotlightCard>
                  </div>

                  {/* Recharts Analytics graphs */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Student Demographics Pie Chart */}
                    <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Student Demographics by Department</h3>
                      <div className="h-60">
                        {!stats.departmentStats || stats.departmentStats.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Insufficient department data.</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.departmentStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {stats.departmentStats.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 6]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: '#111827', borderColor: '#374151', fontSize: 11, borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      
                      {/* Custom Legend */}
                      {stats.departmentStats && stats.departmentStats.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                          {stats.departmentStats.map((entry: any, index: number) => (
                            <div key={`legend-${index}`} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 6] }}></span>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{entry.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Activity Feed */}
                  <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Real-Time Event Activity Logs</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {activityFeed.map((log, idx) => (
                        <div key={idx} className="p-2 border border-white/5 bg-muted/10 rounded-lg text-[10px] font-mono text-muted-foreground">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PANEL 2: MANAGE EVENTS (CRUD) */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider">Campus Catalog Editor</h3>
                <button
                  onClick={() => setShowEventForm(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 flex items-center gap-1 transition clickable"
                >
                  <Plus className="w-4 h-4" /> Create New Event
                </button>
              </div>

              {showEventForm && (
                <SpotlightCard className="p-4 md:p-6 border border-primary/20 bg-card rounded-2xl relative" glowColor="rgba(99, 102, 241, 0.12)">
                  <h4 className="text-base font-bold mb-4">{editingEventId ? 'Edit Event Metadata' : 'Publish New Campus Event'}</h4>
                  
                  <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Event Title</label>
                        <input
                          type="text"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          required
                          placeholder="e.g. SRM Coding Olympiad 2026"
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Category</label>
                        <select
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        >
                          <option value="Technical">Technical</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Sports">Sports</option>
                          <option value="Workshop">Workshop</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-muted-foreground">Detailed Description</label>
                      <textarea
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        required
                        rows={3}
                        placeholder="Detail rules, timelines, prize brackets, and check-in procedures."
                        className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Date (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          required
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Start Time</label>
                        <input
                          type="text"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          required
                          placeholder="09:00 AM"
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Venue Hall</label>
                        <input
                          type="text"
                          value={eventVenue}
                          onChange={(e) => setEventVenue(e.target.value)}
                          required
                          placeholder="e.g. Block C Hall 3"
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Max Seat Capacity</label>
                        <input
                          type="number"
                          value={eventCapacity}
                          onChange={(e) => setEventCapacity(parseInt(e.target.value))}
                          required
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1 mt-4">
                      <label className="text-muted-foreground">External Link (Optional - for online quizzes/events)</label>
                      <input
                        type="url"
                        value={eventExternalLink}
                        onChange={(e) => setEventExternalLink(e.target.value)}
                        placeholder="https://forms.gle/... or https://quizizz.com/..."
                        className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Reg Deadline (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={eventDeadline}
                          onChange={(e) => setEventDeadline(e.target.value)}
                          required
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Skill Difficulty Level</label>
                        <select
                          value={eventLevel}
                          onChange={(e) => setEventLevel(e.target.value as any)}
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground">Prizes details</label>
                        <input
                          type="text"
                          value={eventPrize}
                          onChange={(e) => setEventPrize(e.target.value)}
                          placeholder="e.g. Cash pool: $1000"
                          className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-4 bg-muted/10 p-4 rounded-xl border border-white/5">
                        <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Faculty Coordinator</h4>
                        <div className="space-y-2">
                          <input type="text" value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} required placeholder="Name" className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition" />
                          <input type="email" value={coordinatorEmail} onChange={e => setCoordinatorEmail(e.target.value)} required placeholder="Email" className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition" />
                          <input type="tel" value={coordinatorPhone} onChange={e => setCoordinatorPhone(e.target.value)} required placeholder="Phone" className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition" />
                        </div>
                      </div>
                      
                      <div className="space-y-4 bg-muted/10 p-4 rounded-xl border border-white/5">
                        <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Student Coordinator</h4>
                        <div className="space-y-2">
                          <input type="text" value={studentCoordinatorName} onChange={e => setStudentCoordinatorName(e.target.value)} required placeholder="Name" className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition" />
                          <input type="email" value={studentCoordinatorEmail} onChange={e => setStudentCoordinatorEmail(e.target.value)} required placeholder="Email" className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition" />
                          <input type="tel" value={studentCoordinatorPhone} onChange={e => setStudentCoordinatorPhone(e.target.value)} required placeholder="Phone" className="w-full bg-background border border-muted px-3 py-2 rounded-xl text-foreground outline-none focus:border-primary transition" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex gap-4 justify-end">
                      <button
                        type="button"
                        onClick={resetEventForm}
                        className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saveEventMutation.isPending}
                        className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl transition shadow-md shadow-primary/20 clickable"
                      >
                        {saveEventMutation.isPending ? 'Saving event...' : 'Publish Campus Event'}
                      </button>
                    </div>
                  </form>
                </SpotlightCard>
              )}

              {/* Administrative Events List */}
              {!showEventForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {!adminEvents || adminEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-full p-6 text-center border border-white/5 bg-white/[0.01] rounded-2xl">
                    No college events declared.
                  </p>
                ) : (
                  adminEvents.map((e: any) => (
                    <SpotlightCard key={e._id} className="group relative p-6 bg-card border border-white/10 rounded-2xl shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-primary/30" glowColor="rgba(99, 102, 241, 0.15)">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-display font-bold text-lg text-foreground line-clamp-2">{e.title}</h4>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                            !e.isPublished 
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : e.isRegistrationOpen === false
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {!e.isPublished ? 'Draft' : e.isRegistrationOpen === false ? 'Closed' : 'Live'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{e.date} at {e.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" />
                            <span>{e.availableSeats} / {e.maxCapacity} Seats Available</span>
                          </div>
                        </div>

                        {/* Quick toggle for Registration */}
                        <div className="mt-2 mb-4">
                          {e.isRegistrationOpen !== false ? (
                            <button
                              type="button"
                              onClick={() => toggleRegistrationMutation.mutate({ id: e._id, isOpen: false })}
                              disabled={toggleRegistrationMutation.isPending}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] clickable"
                            >
                              <X className="w-4 h-4" />
                              Close Registration
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleRegistrationMutation.mutate({ id: e._id, isOpen: true })}
                              disabled={toggleRegistrationMutation.isPending}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] clickable"
                            >
                              <Check className="w-4 h-4" />
                              Open Registration
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(e)}
                          className="flex-1 flex justify-center items-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition clickable text-xs font-bold"
                          title="Edit Event"
                        >
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => duplicateMutation.mutate(e._id)}
                          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition clickable border border-white/5"
                          title="Duplicate as Draft"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this event? This will remove all student passes.')) {
                              deleteMutation.mutate(e._id);
                            }
                          }}
                          className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl transition clickable"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </SpotlightCard>
                  ))
                )}
              </div>
              )}
            </div>
          )}

          {/* PANEL 3: REGISTRATIONS MANAGER */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              {/* Event Tabs */}
              <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide snap-x">
                <button
                  onClick={() => setEventFilter('')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start ${
                    eventFilter === ''
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-muted/20 text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  All Events
                </button>
                {adminEvents?.map((evt: any) => (
                  <button
                    key={evt._id}
                    onClick={() => setEventFilter(evt._id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start ${
                      eventFilter === evt._id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-muted/20 text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                    }`}
                  >
                    {evt.title}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 border border-white/5 p-4 rounded-2xl">
                {/* Searching box */}
                <div className="relative flex-1 w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Student name, email, pass ID..."
                    className="w-full bg-background border border-muted pl-9 pr-3 py-2 text-xs rounded-xl text-foreground outline-none focus:border-primary transition"
                  />
                </div>

                {/* Filter list (Removed status filter) */}
                <div className="hidden"></div>

                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold rounded-xl shadow-md hover:bg-emerald-500/20 flex items-center gap-2 transition clickable print:hidden whitespace-nowrap"
                >
                  <Megaphone className="w-4 h-4" /> Print
                </button>
              </div>

              {/* Responsive Bookings List */}
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-white/5 font-bold text-muted-foreground">
                        <th className="p-4">Pass ID</th>
                        <th className="p-4">Student Details</th>
                        <th className="p-4">Registered Event</th>
                        <th className="p-4 text-center">Checked-In</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const filteredRegs = allRegistrations?.filter((r: any) => 
                          eventFilter === '' ? true : r.eventId?._id === eventFilter
                        );
                        if (!filteredRegs || filteredRegs.length === 0) {
                          return (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No bookings recorded.</td></tr>
                          );
                        }
                        
                        return filteredRegs.map((reg: any) => (
                          <tr key={reg._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-mono font-bold text-foreground">
                              {reg.registrationId}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-foreground truncate">{reg.studentId?.name || reg.studentId?.username || 'Deleted student'}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{reg.studentId?.email}</span>
                                <span className="text-[10px] text-primary/80 font-mono mt-0.5">{reg.studentId?.department || 'N/A'} • Yr {reg.studentId?.year || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground truncate">{reg.eventId?.title || 'Unknown Event'}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {reg.eventId?.date}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              {reg.attended ? (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Yes
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> No
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteRegistration(reg._id)}
                                className="px-3 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-500/20 transition clickable inline-flex items-center justify-center gap-1.5 border border-red-500/20 whitespace-nowrap"
                              >
                                <Trash2 className="w-3 h-3" /> Revoke
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 4: ATTENDANCE SCANNER */}
          {activeTab === 'scanner' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance scanner box */}
                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-6 text-center">
                  <ClipboardCheck className="w-12 h-12 text-secondary mx-auto mb-4 animate-pulse" />
                  <h3 className="text-base font-display font-bold">Attendance Check-in</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
                    Type the registration code, name, or registration number below to mark student attendance.
                  </p>

                  <form onSubmit={triggerCheckInScan} className="space-y-4 max-w-xs mx-auto">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Event</label>
                      <select
                        value={scannerEventId}
                        onChange={(e) => setScannerEventId(e.target.value)}
                        className="w-full bg-background border border-muted px-3 py-2 text-xs rounded-xl text-foreground outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="">-- All Events --</option>
                        {adminEvents?.map((event: any) => (
                          <option key={event._id} value={event._id}>{event.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-left relative">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Registration Code, Name, or Reg No</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                          <Keyboard className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={scanCode}
                          onChange={(e) => setScanCode(e.target.value)}
                          onFocus={() => setShowScannerAutocomplete(true)}
                          onBlur={() => setTimeout(() => setShowScannerAutocomplete(false), 200)}
                          required
                          placeholder="e.g. John Doe, 21IT001, CH-XXXX"
                          className="w-full bg-background border border-muted pl-9 pr-3 py-2 text-xs rounded-xl text-foreground outline-none focus:border-primary uppercase font-mono font-bold"
                        />
                      </div>
                      
                      {showScannerAutocomplete && filteredScannerStudents.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-card border border-muted rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                          {filteredScannerStudents.map((r: any) => (
                            <li 
                              key={r._id} 
                              className="px-3 py-2 hover:bg-muted/50 cursor-pointer text-left border-b border-border/50 last:border-0"
                              onMouseDown={() => {
                                setScanCode(r.registrationId);
                                setShowScannerAutocomplete(false);
                              }}
                            >
                              <div className="text-xs font-bold text-foreground">{r.studentId?.name || r.studentId?.username}</div>
                              <div className="text-[10px] text-muted-foreground">{r.studentId?.registrationNumber} | Pass: <span className="font-mono">{r.registrationId}</span></div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={scanLoading}
                      className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl transition shadow-md shadow-primary/25 clickable"
                    >
                      {scanLoading ? 'Checking entry...' : 'Confirm Attendance'}
                    </button>
                  </form>
                </div>

                {/* Scan verification display console */}
                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-6 flex flex-col justify-center items-center text-center relative">
                  {scanLoading ? (
                    <Loader />
                  ) : scanError ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 w-14 h-14 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Entry Denied</h3>
                      <p className="text-xs text-red-400 max-w-sm leading-relaxed">{scanError}</p>
                    </div>
                  ) : scanResult ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-14 h-14 flex items-center justify-center mx-auto">
                        <Check className="w-7 h-7 text-emerald-400 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full uppercase">Ticket Verified</span>
                        <h3 className="text-xl font-display font-bold text-foreground mt-3">{scanResult.studentName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Reg No: {scanResult.registrationNumber} ({scanResult.department})</p>
                      </div>

                      <div className="p-4 bg-muted/20 border border-white/5 rounded-xl text-xs space-y-1.5 text-left max-w-xs mx-auto">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rewarded:</span>
                          <span className="font-bold text-secondary">+50 XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current streak:</span>
                          <span className="font-bold text-primary">{scanResult.streak} Events</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">New Badges:</span>
                          <span className="font-bold text-foreground">{scanResult.badges?.join(', ') || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-12">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Enter registration code, name, or registration number to display attendance report.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PANEL: MANAGE COORDINATORS */}
          {activeTab === 'coordinators' && user?.role === 'super-admin' && (
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row gap-6">
                
                {/* Create Coordinator Form */}
                <div className="xl:w-1/3 bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col h-fit">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <FolderPlus className="w-5 h-5" />
                      </div>
                      Create Coordinator
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">Provision access for new event coordinators and assign their roles.</p>
                  </div>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('name') as string;
                      const email = formData.get('email') as string;
                      const password = formData.get('password') as string;
                      const assignedEvent = formData.get('assignedEvent') as string;
                      const eventRole = formData.get('eventRole') as string;
                      
                      if(name && email && password) {
                        createCoordinatorMutation.mutate({ 
                          username: name, 
                          email, 
                          password, 
                          assignedEvent: assignedEvent || undefined,
                          eventRole: eventRole || undefined
                        });
                        if (!createCoordinatorMutation.isError) {
                          e.currentTarget.reset();
                        }
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Full Name</label>
                      <input name="name" type="text" required placeholder="John Doe" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Email Address</label>
                      <input name="email" type="email" required placeholder="john@example.com" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Temporary Password</label>
                      <input name="password" type="text" required placeholder="••••••••" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 mt-2">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Assign to Event (Optional)</label>
                        <input name="assignedEvent" type="text" placeholder="e.g. Hackathon 2026" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Role in Event (Optional)</label>
                        <input name="eventRole" type="text" placeholder="e.g. Registration Desk, Judge" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none" />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={createCoordinatorMutation.isPending}
                      className="w-full mt-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {createCoordinatorMutation.isPending ? 'Provisioning...' : (
                        <>
                          <FolderPlus className="w-4 h-4" />
                          Provision Account
                        </>
                      )}
                    </button>
                    
                    {createCoordinatorMutation.isError && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                        <p className="text-xs text-red-500 font-medium">
                          {(createCoordinatorMutation.error as any)?.response?.data?.message || 'Failed to create coordinator. Please try again.'}
                        </p>
                      </div>
                    )}
                    {createCoordinatorMutation.isSuccess && (
                      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                        <p className="text-xs text-emerald-500 font-medium">Coordinator provisioned successfully!</p>
                      </div>
                    )}
                  </form>
                </div>

                {/* List of Coordinators */}
                <div className="xl:w-2/3 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">Active Coordinators</h3>
                    <div className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-xs text-muted-foreground border border-black/10 dark:border-white/10">
                      Total: <span className="text-foreground font-bold">{allCoordinators?.length || 0}</span>
                    </div>
                  </div>
                  
                  {coordinatorsLoading ? (
                    <div className="p-12 flex justify-center text-primary"><span className="text-sm font-medium animate-pulse">Loading coordinators...</span></div>
                  ) : !allCoordinators || allCoordinators.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground border border-black/5 dark:border-white/5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.01]">
                      <p>No coordinators have been provisioned yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allCoordinators.map((coord: any) => (
                        <div key={coord.id} className="relative group p-5 bg-card border border-black/10 dark:border-white/10 shadow-sm rounded-2xl transition-all duration-300 flex flex-col">
                          {/* Top row: ID and Status */}
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2.5 py-1 bg-black/5 dark:bg-white/5 text-[10px] font-mono tracking-wider text-muted-foreground rounded-md border border-black/10 dark:border-white/10">
                              {coord.coordinatorId || 'COORD-UNASSIGNED'}
                            </span>
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${coord.isLocked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              {coord.isLocked ? 'LOCKED' : 'ACTIVE'}
                            </span>
                          </div>
                          
                          {/* Coordinator Details */}
                          <div className="mb-4">
                            <h4 className="text-base font-bold text-foreground">{coord.name || coord.username}</h4>
                            <p className="text-xs text-muted-foreground truncate">{coord.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">Pass: <span className="font-mono text-foreground bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded">{coord.password || 'Hidden'}</span></p>
                          </div>
                          
                          <div className="mb-5 flex-1">
                            <p className="text-[11px] text-muted-foreground mb-1 uppercase font-semibold tracking-wider">Assigned Event / Role</p>
                            <p className="text-sm font-medium text-foreground truncate">{coord.assignedEvent || 'General Access'}</p>
                            {coord.eventRole && (
                              <p className="text-xs text-primary font-medium mt-0.5 truncate">{coord.eventRole}</p>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleCoordinatorLockMutation.mutate(coord.id)}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${coord.isLocked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'}`}
                            >
                              {coord.isLocked ? 'Restore Access' : 'Deny Access'}
                            </button>
                            <button 
                              onClick={() => {
                                if(window.confirm(`Are you sure you want to permanently delete coordinator ${coord.username}?`)) {
                                  deleteCoordinatorMutation.mutate(coord.id);
                                }
                              }}
                              className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PANEL: REGISTERED MEMBERS DIRECTORY */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 border border-white/5 p-4 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-foreground">Registered Members Directory</h3>
                  <p className="text-xs text-muted-foreground mt-1">View all students registered on the platform.</p>
                </div>
                
                {/* Year Filter Tabs */}
                <div className="flex overflow-x-auto gap-2 bg-background p-1 rounded-xl border border-white/5">
                  {[
                    { val: '', label: 'All Years' },
                    { val: '1st', label: '1st Year' },
                    { val: '2nd', label: '2nd Year' },
                    { val: '3rd', label: '3rd Year' },
                    { val: '4th', label: '4th Year' }
                  ].map((yr) => (
                    <button
                      key={yr.val}
                      onClick={() => setMemberYearFilter(yr.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        memberYearFilter === yr.val
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      {yr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-white/5 font-bold text-muted-foreground">
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Registration No</th>
                        <th className="p-4">Department</th>
                        <th className="p-4 text-center">Year/Sec</th>
                        <th className="p-4 text-center">XP Points</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const filteredMembers = allMembers?.filter((m: any) => 
                          memberYearFilter === '' ? true : (m.year && m.year.startsWith(memberYearFilter))
                        );
                        
                        if (membersLoading) {
                          return <tr><td colSpan={7} className="p-6 text-center text-muted-foreground"><Loader /></td></tr>;
                        }
                        if (!filteredMembers || filteredMembers.length === 0) {
                          return <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No registered members found for this year.</td></tr>;
                        }
                        
                        return filteredMembers.map((member: any) => (
                          <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-foreground">{member.name || member.username}</p>
                              <p className="text-muted-foreground">@{member.username}</p>
                            </td>
                            <td className="p-4 text-muted-foreground">{member.email}</td>
                            <td className="p-4 font-mono">{member.registrationNumber || <span className="italic text-muted-foreground">Not set</span>}</td>
                            <td className="p-4 text-foreground">{member.department || '—'}</td>
                            <td className="p-4 text-center font-bold">
                              {member.year ? `${member.year} / ${member.section}` : '—'}
                            </td>
                            <td className="p-4 text-center text-secondary font-bold">
                              {member.participationPoints} XP
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  if(window.confirm(`Are you sure you want to permanently delete the account for ${member.name || member.username}?`)) {
                                    deleteMemberMutation.mutate(member.id);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all border border-red-500/20 clickable"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PUBLISH WINNERS & CERTIFICATES */}
          {activeTab === 'winners' && (() => {
            const selectedEvent = adminEvents?.find((e: any) => e._id === certSelectedEventId);
            const eventRegs = allRegistrations?.filter((r: any) => r.eventId?._id === certSelectedEventId) || [];
            const attendedRegs   = eventRegs.filter((r: any) => r.attended);
            const certifiedCount = attendedRegs.filter((r: any) => r.certificateIssued).length;

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Winners & Certificates</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Select an event to publish winners and manage student certificates.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={certSelectedEventId}
                      onChange={(e) => setCertSelectedEventId(e.target.value)}
                      className="bg-card border border-border px-4 py-2.5 text-sm rounded-xl text-foreground outline-none focus:border-primary transition min-w-[220px] font-medium"
                    >
                      <option value="">— Select an Event —</option>
                      {adminEvents?.map((ev: any) => (
                        <option key={ev._id} value={ev._id}>{ev.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!certSelectedEventId ? (
                  <div className="border border-dashed border-border rounded-2xl p-16 text-center">
                    <Trophy className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-foreground">Select an Event</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      Choose an event to publish its results.
                    </p>
                  </div>
                ) : (
                  <>
                  <div className="border border-border rounded-2xl overflow-hidden bg-card">
                    <div className="p-6 space-y-8 relative overflow-hidden">
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                      
                      <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary font-bold">
                          #
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">Winner Announcements</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Fill in the details to publish the winners for this event.</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1st Place */}
                        <div className="relative space-y-4 p-5 bg-card border border-border rounded-xl transition-all duration-300 shadow-sm hover:border-primary/50">
                          <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                              1
                            </div>
                            <h4 className="font-bold text-foreground tracking-wide text-sm">Position 1</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Student Name</label>
                              <input disabled={isWinnersPublished} type="text" value={winner1st.username} onChange={e => setWinner1st({...winner1st, username: e.target.value})} placeholder="e.g. John Doe" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Registration No.</label>
                              <input disabled={isWinnersPublished} type="text" value={winner1st.regNo} onChange={e => setWinner1st({...winner1st, regNo: e.target.value})} placeholder="e.g. 12345678" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Year / Section</label>
                              <input disabled={isWinnersPublished} type="text" value={winner1st.year} onChange={e => setWinner1st({...winner1st, year: e.target.value})} placeholder="e.g. III / A" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                          </div>
                        </div>
                        
                        {/* 2nd Place */}
                        <div className="relative space-y-4 p-5 bg-card border border-border rounded-xl transition-all duration-300 shadow-sm hover:border-primary/50 mt-4 md:mt-0">
                          <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center text-sm font-bold border border-border">
                              2
                            </div>
                            <h4 className="font-bold text-foreground tracking-wide text-sm">Position 2</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Student Name</label>
                              <input disabled={isWinnersPublished} type="text" value={winner2nd.username} onChange={e => setWinner2nd({...winner2nd, username: e.target.value})} placeholder="e.g. Jane Smith" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Registration No.</label>
                              <input disabled={isWinnersPublished} type="text" value={winner2nd.regNo} onChange={e => setWinner2nd({...winner2nd, regNo: e.target.value})} placeholder="e.g. 87654321" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Year / Section</label>
                              <input disabled={isWinnersPublished} type="text" value={winner2nd.year} onChange={e => setWinner2nd({...winner2nd, year: e.target.value})} placeholder="e.g. II / B" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                          </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="relative space-y-4 p-5 bg-card border border-border rounded-xl transition-all duration-300 shadow-sm hover:border-primary/50 mt-4 md:mt-0">
                          <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center text-sm font-bold border border-border">
                              3
                            </div>
                            <h4 className="font-bold text-foreground tracking-wide text-sm">Position 3</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Student Name</label>
                              <input disabled={isWinnersPublished} type="text" value={winner3rd.username} onChange={e => setWinner3rd({...winner3rd, username: e.target.value})} placeholder="e.g. Alex Johnson" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Registration No.</label>
                              <input disabled={isWinnersPublished} type="text" value={winner3rd.regNo} onChange={e => setWinner3rd({...winner3rd, regNo: e.target.value})} placeholder="e.g. 11223344" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Year / Section</label>
                              <input disabled={isWinnersPublished} type="text" value={winner3rd.year} onChange={e => setWinner3rd({...winner3rd, year: e.target.value})} placeholder="e.g. I / C" className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-border/50 gap-3">
                        {isWinnersPublished ? (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete these winners? This action will remove them from the Leaderboard.')) {
                                  announceWinnersMutation.mutate({
                                    eventId: certSelectedEventId,
                                    title: `Winners Removed: ${selectedEvent?.title}`,
                                    content: `The winners for ${selectedEvent?.title} have been revoked.`,
                                    winners: []
                                  });
                                  setIsWinnersPublished(false);
                                  setWinner1st({ username: '', regNo: '', year: '' });
                                  setWinner2nd({ username: '', regNo: '', year: '' });
                                  setWinner3rd({ username: '', regNo: '', year: '' });
                                }
                              }}
                              disabled={announceWinnersMutation.isPending}
                              className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-xl transition-all shadow-sm border border-red-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> {announceWinnersMutation.isPending ? 'Processing...' : 'Delete Winners'}
                            </button>
                            <button
                              onClick={() => setIsWinnersPublished(false)}
                              className="px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" /> Edit Winners
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              const validWinners = [];
                              if (winner1st.username) validWinners.push({ place: '1st', ...winner1st });
                              if (winner2nd.username) validWinners.push({ place: '2nd', ...winner2nd });
                              if (winner3rd.username) validWinners.push({ place: '3rd', ...winner3rd });
                              
                              if (validWinners.length === 0) {
                                alert('Please fill in at least one winner to announce.');
                                return;
                              }
                              
                              announceWinnersMutation.mutate({
                                eventId: certSelectedEventId,
                                title: `Winners Declared: ${selectedEvent?.title}`,
                                content: `Congratulations to the winners of ${selectedEvent?.title}!\n\n1st Place: ${winner1st.username}\n2nd Place: ${winner2nd.username}\n3rd Place: ${winner3rd.username}`,
                                winners: validWinners
                              }, {
                                onSuccess: () => {
                                  setIsWinnersPublished(true);
                                }
                              });
                            }}
                            disabled={announceWinnersMutation.isPending}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                          >
                            {announceWinnersMutation.isPending ? 'Publishing...' : 'Publish Winners'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* --- CERTIFICATES UI FOR MOBILE/DESKTOP --- */}
                  <div className="border border-border rounded-2xl overflow-hidden bg-card mt-8">
                      <div className="p-6 border-b border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                           <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                             <Award className="w-5 h-5 text-amber-500" /> Certificates Manager
                           </h3>
                           <p className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-2 items-center">
                             <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{eventRegs.length} Booked</span>
                             <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium">{attendedRegs.length} Attended</span>
                             <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-medium">{certifiedCount} Issued</span>
                           </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Issue certificates to all ' + attendedRegs.length + ' attendees?')) {
                              bulkVerifyMutation.mutate(certSelectedEventId);
                            }
                          }}
                          disabled={bulkVerifyMutation.isPending || attendedRegs.length === 0}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition shadow-md disabled:opacity-50 w-full sm:w-auto"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {bulkVerifyMutation.isPending ? 'Issuing...' : 'Issue All'}
                        </button>
                      </div>

                      {eventRegs.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <Users className="w-10 h-10 mx-auto opacity-20 mb-3" />
                          <p className="text-sm">No students registered for this event yet.</p>
                        </div>
                      ) : (
                        <div className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-muted/30 border-b border-white/5 font-bold text-muted-foreground">
                                  <th className="p-4">Student Info</th>
                                  <th className="p-4">Reg. Number</th>
                                  <th className="p-4 text-center">Attendance</th>
                                  <th className="p-4 text-center">Status</th>
                                  <th className="p-4 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {eventRegs.map((reg: any) => {
                                  const s = reg.studentId;
                                  return (
                                    <tr key={reg._id} className="hover:bg-muted/10 transition-colors">
                                      <td className="p-4">
                                        <div className="flex items-center gap-3 min-w-[150px]">
                                          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 shadow-sm transition-transform">
                                            {(s?.username || 'S').charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-foreground text-sm truncate">{s?.name || s?.username || '—'}</p>
                                            <p className="text-xs text-muted-foreground truncate">{s?.email || '—'}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <span className="font-mono text-foreground font-semibold bg-muted/50 px-2 py-1 rounded-md">{s?.registrationNumber || <span className="text-muted-foreground italic">Not set</span>}</span>
                                      </td>
                                      <td className="p-4 text-center">
                                        {reg.attended ? (
                                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2 py-1 rounded-md">
                                            <Check className="w-3.5 h-3.5" /> Yes
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground text-xs bg-muted/50 px-2 py-1 rounded-md">No</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                          reg.certificateIssued
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : reg.attended
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                          {reg.certificateIssued ? 'Issued' : reg.attended ? 'Eligible' : 'No'}
                                        </span>
                                      </td>
                                      <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <button
                                            onClick={() => setCertPreviewReg({ reg, student: s, event: selectedEvent })}
                                            className="p-2 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition clickable"
                                            title="Preview Certificate"
                                          >
                                            <Camera className="w-4 h-4 transition-transform" />
                                          </button>
                                          {reg.attended && !reg.certificateIssued && (
                                            <button
                                              onClick={() => issueCertificateMutation.mutate(reg._id)}
                                              disabled={issueCertificateMutation.isPending}
                                              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition clickable disabled:opacity-50"
                                            >
                                              Issue
                                            </button>
                                          )}
                                          {reg.attended && reg.certificateIssued && (
                                            <>
                                              <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Issued</span>
                                              <a
                                                href={`http://localhost:5000/api/registrations/${reg._id}/certificate`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition clickable flex items-center justify-center"
                                                title="Download Certificate PDF"
                                              >
                                                <Download className="w-4 h-4 transition-transform" />
                                              </a>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* PANEL: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-6 mt-4 md:mt-8">
              {/* Header Card */}
              <SpotlightCard className="relative overflow-hidden p-6 md:p-8 glassmorphism-card shadow-lg border border-border/50" glowColor="rgba(139, 92, 246, 0.15)">
                {/* Background Banner */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-purple-500/20 pointer-events-none border-b border-white/5" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left mt-8 md:mt-12">
                  {/* Avatar Section */}
                  <div className="relative group mx-auto md:mx-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-full bg-gradient-to-br from-primary via-indigo-500 to-purple-600 p-1 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center border-[4px] border-background relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 dark:to-white/5" />
                        <span className="text-4xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-500">
                          {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2 rounded-full border-[4px] border-background shadow-lg">
                      <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </div>

                  <div className="flex-1 w-full flex flex-col items-center md:items-start">
                    <h2 className="text-2xl md:text-3xl font-display font-black text-foreground tracking-tight break-words">
                      {user?.name || user?.username}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2 mb-4 justify-center md:justify-start">
                      <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-lg border border-border/50">@{user?.username}</span>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{user?.email}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 w-full mb-6">
                      <div className="px-3 py-1.5 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {user?.role === 'event-coordinator' ? 'Event Coordinator' : user?.role === 'super-admin' ? 'System Admin' : user?.role === 'volunteer' ? 'Volunteer' : 'Staff'}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Active</span>
                      </div>
                    </div>
                    
                    {/* Mobile Logout Button */}
                    <button
                      onClick={logout}
                      className="md:hidden w-full py-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm font-bold uppercase tracking-widest text-destructive hover:bg-destructive/20 transition-all clickable flex items-center justify-center gap-2 shadow-sm"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>

                    {/* Additional Management Actions (Mobile-Optimized) */}
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full">
                      {(user?.role === 'super-admin' || user?.role === 'event-coordinator') && (
                        <>
                          <button
                            onClick={() => { setActiveTab('announcements'); window.scrollTo(0, 0); }}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all clickable shadow-sm hover:shadow-md w-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                                <Megaphone className="w-5 h-5 text-primary" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-foreground">Announcements</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Manage alerts</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </button>

                          <button
                            onClick={() => { setActiveTab('winners'); window.scrollTo(0, 0); }}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:border-indigo-500/50 transition-all clickable shadow-sm hover:shadow-md w-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                <Trophy className="w-5 h-5 text-indigo-500" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-foreground">Winners</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Manage certificates</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                          </button>
                        </>
                      )}
                      
                      {user?.role === 'super-admin' && (
                        <>
                          <button
                            onClick={() => { setActiveTab('support'); window.scrollTo(0, 0); }}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/50 transition-all clickable shadow-sm hover:shadow-md w-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-5 h-5 text-emerald-500" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-foreground">Support Tickets</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">View user issues</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                          </button>
                          
                          <button
                            onClick={() => { setActiveTab('coordinators'); window.scrollTo(0, 0); }}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:border-amber-500/50 transition-all clickable shadow-sm hover:shadow-md w-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-5 h-5 text-amber-500" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-foreground">Coordinators</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Manage access</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Role & Permissions Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-card to-muted/20 border border-border/80 shadow-sm rounded-2xl p-5 flex flex-col hover:border-primary/40 hover:shadow-md transition-all">
                  <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Authorization Level
                  </span>
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                    {user?.role === 'event-coordinator' 
                      ? 'You are authorized to manage your assigned events, scan attendee QR codes, and assist with on-ground coordination.' 
                      : user?.role === 'super-admin' 
                      ? 'You have full system access, including managing coordinators, overriding registrations, and creating campus-wide events.' 
                      : 'You can assist in scanning QR passes and general event management duties.'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-card to-muted/20 border border-border/80 shadow-sm rounded-2xl p-5 flex flex-col hover:border-primary/40 hover:shadow-md transition-all">
                  <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Security Status
                  </span>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Account Status</span>
                      <span className="text-xs font-bold text-emerald-500">Verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Last Login</span>
                      <span className="text-xs font-bold text-foreground">Today</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Session</span>
                      <span className="text-xs font-bold text-foreground">Secure</span>
                    </div>
                  </div>
                </div>

                {user?.role === 'event-coordinator' && (user?.assignedEvent || user?.eventRole) && (
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user?.assignedEvent && (
                      <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col">
                        <span className="text-[10px] font-bold text-primary/70 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Assigned Event</span>
                        <p className="text-sm md:text-base font-bold text-foreground">{user.assignedEvent}</p>
                      </div>
                    )}
                    {user?.eventRole && (
                      <div className="bg-secondary/5 border border-secondary/20 p-5 rounded-2xl flex flex-col">
                        <span className="text-[10px] font-bold text-secondary/70 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Award className="w-3 h-3"/> Event Role</span>
                        <p className="text-sm md:text-base font-bold text-foreground">{user.eventRole}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 8: ANNOUNCEMENTS MANAGER */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Announcements Manager</h2>
                  <p className="text-sm text-muted-foreground mt-1">Publish campus-wide alerts or updates directly to the student dashboard.</p>
                </div>
              </div>

              {/* Create/Edit Form */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">{editingAnnouncementId ? 'Edit Announcement' : 'New Announcement'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Title</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border px-4 py-2 text-sm rounded-xl outline-none focus:border-primary transition-all"
                      placeholder="e.g., Hackathon Venue Shifted"
                      value={announcementForm.title}
                      onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Category</label>
                    <select
                      className="w-full bg-background border border-border px-4 py-2 text-sm rounded-xl outline-none focus:border-primary transition-all"
                      value={announcementForm.category}
                      onChange={e => setAnnouncementForm({...announcementForm, category: e.target.value})}
                    >
                      <option value="General">General</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Venue Change">Venue Change</option>
                      <option value="Reminder">Reminder</option>
                      <option value="Winner">Winner</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Content</label>
                    <textarea
                      className="w-full bg-background border border-border px-4 py-3 text-sm rounded-xl outline-none focus:border-primary transition-all min-h-[100px]"
                      placeholder="Enter the announcement message..."
                      value={announcementForm.content}
                      onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  {editingAnnouncementId && (
                    <button
                      onClick={() => {
                        setEditingAnnouncementId(null);
                        setAnnouncementForm({ title: '', content: '', category: 'General', eventId: '' });
                      }}
                      className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-white/5 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!announcementForm.title || !announcementForm.content) return alert('Title and Content required');
                      if (editingAnnouncementId) {
                        updateAnnouncementMutation.mutate({ id: editingAnnouncementId, data: announcementForm });
                      } else {
                        createAnnouncementMutation.mutate(announcementForm);
                      }
                      setAnnouncementForm({ title: '', content: '', category: 'General', eventId: '' });
                      setEditingAnnouncementId(null);
                    }}
                    disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                    className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    <Megaphone className="w-4 h-4" />
                    {editingAnnouncementId ? 'Update Announcement' : 'Publish Announcement'}
                  </button>
                </div>
              </div>

              {/* Announcements List */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-foreground">Recent Announcements</h3>
                </div>
                {announcementsLoading ? (
                  <div className="p-8 text-center"><span className="text-sm font-medium animate-pulse text-muted-foreground">Loading announcements...</span></div>
                ) : announcements?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No announcements published yet.</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {announcements?.map((ann: any) => (
                      <div key={ann._id} className="p-5 flex flex-col md:flex-row gap-4 items-start justify-between hover:bg-white/[0.01] transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">{ann.category}</span>
                            <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-bold text-foreground text-sm mb-1">{ann.title}</h4>
                          <p className="text-sm text-muted-foreground">{ann.content}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingAnnouncementId(ann._id);
                              setAnnouncementForm({
                                title: ann.title,
                                content: ann.content,
                                category: ann.category,
                                eventId: ann.eventId?._id || ''
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this announcement?')) {
                                deleteAnnouncementMutation.mutate(ann._id);
                              }
                            }}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 9: SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/20 shadow-inner">
                  <MessageSquare className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">Support Tickets</h2>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">View and resolve issues reported by students across the campus.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {supportTicketsLoading ? (
                  <SpotlightCard className="p-12 text-center border-border/50 bg-card/50 rounded-3xl" glowColor="rgba(99, 102, 241, 0.1)">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
                    <span className="text-sm font-medium animate-pulse text-muted-foreground">Loading student support tickets...</span>
                  </SpotlightCard>
                ) : supportTickets?.length === 0 ? (
                  <SpotlightCard className="p-16 text-center border-border/50 bg-card/50 rounded-3xl" glowColor="rgba(99, 102, 241, 0.1)">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">All Caught Up!</h3>
                    <p className="text-muted-foreground text-sm mt-2">There are no pending support tickets at the moment.</p>
                  </SpotlightCard>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {supportTickets?.map((ticket: any) => (
                      <SpotlightCard key={ticket._id} className="p-6 border-border/50 bg-card/50 backdrop-blur-xl rounded-3xl shadow-xl transition-all hover:-translate-y-1" glowColor={ticket.status === 'Open' ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)"}>
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${
                                ticket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                ticket.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {ticket.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                                {ticket.status === 'In Progress' && <Clock className="w-3 h-3" />}
                                {ticket.status === 'Open' && <AlertTriangle className="w-3 h-3" />}
                                {ticket.status}
                              </span>
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(ticket.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                            
                            <h4 className="font-black text-foreground text-lg mb-4">{ticket.subject}</h4>
                            
                            <div className="bg-muted/50 border border-border/50 rounded-2xl p-5 mb-5 relative group">
                              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <MessageSquare className="w-12 h-12 text-foreground" />
                              </div>
                              <p className="text-sm text-foreground font-medium whitespace-pre-wrap leading-relaxed relative z-10">{ticket.message}</p>
                            </div>

                            {/* Student Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 border border-border/50 p-4 rounded-2xl relative z-10">
                               <div className="space-y-1">
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Student Name</span>
                                 <span className="text-sm font-semibold text-foreground truncate block" title={ticket.studentId?.name || ticket.studentId?.username || 'Unknown'}>
                                   {ticket.studentId?.name || ticket.studentId?.username || 'Unknown Student'}
                                 </span>
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Reg No.</span>
                                 <span className="text-sm font-semibold text-foreground truncate block font-mono">
                                   {ticket.studentId?.registrationNumber || 'N/A'}
                                 </span>
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Year</span>
                                 <span className="text-sm font-semibold text-foreground truncate block">
                                   {ticket.studentId?.year || 'N/A'}
                                 </span>
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Email Address</span>
                                 <a href={`mailto:${ticket.studentId?.email}`} className="text-sm font-semibold text-primary hover:text-primary/80 truncate block hover:underline" title={ticket.studentId?.email}>
                                   {ticket.studentId?.email || 'N/A'}
                                 </a>
                               </div>
                            </div>
                          </div>
                          
                          <div className="shrink-0 flex flex-row md:flex-col gap-3 w-full md:w-40 pt-1 md:pt-0 relative z-20">
                            {ticket.status !== 'Resolved' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); updateSupportTicketMutation.mutate({ id: ticket._id, status: 'Resolved' }); }}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold rounded-xl transition border border-emerald-500/20 clickable"
                              >
                                Mark Resolved
                              </button>
                            )}
                            {ticket.status === 'Open' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); updateSupportTicketMutation.mutate({ id: ticket._id, status: 'In Progress' }); }}
                                className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold rounded-xl transition border border-amber-500/20 clickable"
                              >
                                Mark In Progress
                              </button>
                            )}
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if(window.confirm('Are you sure you want to delete this support ticket?')) {
                                  deleteSupportTicketMutation.mutate(ticket._id);
                                }
                              }}
                              className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold rounded-xl transition border border-red-500/20 clickable"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </SpotlightCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── CERTIFICATE PREVIEW MODAL ── */}
      {certPreviewReg && (() => {
        const { reg, student, event } = certPreviewReg;
        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-6 md:p-12 overflow-y-auto" onClick={() => setCertPreviewReg(null)}>
            <div className="w-full max-w-3xl my-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Actions bar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/70 text-sm font-medium">Certificate Preview — Auto-filled from student login data</p>
                <div className="flex items-center gap-2">
                  {reg.attended && (
                    <a
                      href={`http://localhost:5000/api/registrations/${reg._id}/certificate`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </a>
                  )}
                  <button onClick={() => setCertPreviewReg(null)} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Certificate Visual */}
              <div
                className="relative overflow-hidden font-serif bg-white shadow-2xl rounded-lg p-6 md:p-12"
                style={{
                  border: '8px solid #0f172a',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {/* Inner border */}
                <div className="absolute inset-2 border-2 border-slate-200 rounded pointer-events-none" />
                
                {/* Decorative corner accents (gold/bronze) */}
                <div className="absolute top-4 left-4 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-amber-700" />
                <div className="absolute top-4 right-4 w-6 h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-amber-700" />
                <div className="absolute bottom-4 left-4 w-6 h-6 md:w-8 md:h-8 border-b-2 border-l-2 border-amber-700" />
                <div className="absolute bottom-4 right-4 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-amber-700" />

                {/* Subtle background watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] text-[100px] md:text-[160px] font-black text-slate-900 tracking-tighter pointer-events-none select-none">
                  Information Technology
                </div>

                <div className="text-center relative z-10">
                  {/* College name */}
                  <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <img src="/gtec_logo.png" alt="GTEC" className="w-8 h-8 md:w-11 md:h-11 object-contain" />
                    <h2 className="text-slate-900 text-[10px] md:text-base font-sans font-extrabold tracking-wider uppercase m-0">
                      Ganadipathy Tulsi's Jain Engineering College
                    </h2>
                  </div>

                  {/* Title */}
                  <h1 className="text-amber-700 text-lg md:text-3xl tracking-[0.1em] md:tracking-[0.15em] uppercase font-bold mt-4 md:mt-6 mb-3 md:mb-4">
                    Certificate of Participation
                  </h1>

                  {/* This certifies */}
                  <p className="text-slate-600 text-xs md:text-sm italic mb-4 md:mb-5">
                    This is to proudly certify that
                  </p>

                  {/* Student Name */}
                  <h2 className="text-slate-900 text-2xl md:text-5xl font-bold mb-4 md:mb-6 tracking-wide font-sans">
                    {student?.name || 'Student Name'}
                  </h2>

                  <p className="text-slate-600 text-xs md:text-sm italic mb-2 md:mb-2">
                    has successfully participated in the event
                  </p>

                  {/* Event Name */}
                  <h3 className="text-slate-900 text-lg md:text-2xl font-bold mb-3 md:mb-4 font-sans">
                    "{event?.title || 'Event Name'}"
                  </h3>
                  
                  {/* Simplified details (No Venue, No Pass ID) */}
                  <p className="text-slate-500 text-[10px] md:text-sm font-sans font-medium mb-8 md:mb-10">
                    Held on {new Date(event?.date || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                  {/* Footer */}
                  <div className="flex justify-between items-end mt-8 md:mt-10 px-2 md:px-5">
                    <div className="text-center">
                      <div className="h-6 md:h-7 flex items-end justify-center mb-1">
                        <img src="/principal-signature.png" alt="Signature" className="h-full object-contain opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                      <div className="w-24 md:w-32 border-t border-slate-300 mx-auto" />
                      <p className="text-slate-900 text-[9px] md:text-xs font-bold mt-1 md:mt-2 uppercase tracking-wider font-sans">Principal</p>
                    </div>
                    
                    {/* Seal */}
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-amber-700/30 flex items-center justify-center relative">
                      <div className="absolute inset-1 border border-dashed border-amber-700/40 rounded-full animate-[spin_20s_linear_infinite]" />
                      <Award className="w-5 h-5 md:w-7 md:h-7 text-amber-700/80" />
                    </div>

                    <div className="text-center">
                      <div className="h-6 md:h-7 flex items-end justify-center mb-1">
                        <img src="/coordinator-signature.png" alt="Signature" className="h-full object-contain opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                      <div className="w-24 md:w-32 border-t border-slate-300 mx-auto" />
                      <p className="text-slate-900 text-[9px] md:text-xs font-bold mt-1 md:mt-2 uppercase tracking-wider font-sans">Coordinator</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}




      {/* FOOTER */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-auto print:hidden">
        <p>Information Technology Coordinator Portal &copy; 2026. All rights reserved.</p>
      </footer>

      {/* PRINTABLE HOD SHEET */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-8 text-sm min-h-screen">
        <div className="flex flex-col items-center mb-6">
          <img src="/gtec_logo.png" alt="GTEC Logo" className="h-24 mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-center mb-1">Ganadipathy Tulsi's Jain Engineering College</h1>
          <h2 className="text-lg font-semibold text-center">Event Participants List</h2>
        </div>
        
        {eventFilter ? (
          <p className="mb-4"><strong>Event:</strong> {adminEvents?.find((e:any) => e._id === eventFilter)?.title}</p>
        ) : (
          <p className="mb-4 text-red-600 font-bold">Please select a specific event from the dropdown before printing for HOD approval.</p>
        )}

        {eventFilter && (
          <table className="w-full border-collapse border border-gray-400 mb-20 text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 p-2">S.No</th>
                <th className="border border-gray-400 p-2">Pass ID</th>
                <th className="border border-gray-400 p-2">Student Name</th>
                <th className="border border-gray-400 p-2">Email</th>
                <th className="border border-gray-400 p-2">Year</th>
              </tr>
            </thead>
            <tbody>
              {allRegistrations?.filter((r: any) => r.eventId?._id === eventFilter).map((reg: any, idx: number) => (
                <tr key={reg._id}>
                  <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-400 p-2 font-mono">{reg.registrationId}</td>
                  <td className="border border-gray-400 p-2 font-semibold">{reg.studentId?.name || reg.studentId?.username || 'N/A'}</td>
                  <td className="border border-gray-400 p-2">{reg.studentId?.email || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 text-center">{reg.studentId?.year || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-between items-end mt-20 pt-10">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="font-semibold">Event Coordinator</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="font-semibold">Head of Department (HOD)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
