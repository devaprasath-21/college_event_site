import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { SpotlightCard } from '../components/SpotlightCard';
import { Loader, SkeletonCard } from '../components/Loader';
import { 
  Award, Calendar as CalendarIcon, MapPin, Search, Star, Heart, CheckCircle2, 
  MessageSquare, User, Users, Trophy, Bell, Megaphone, Clock, Download, Printer, LogOut, CheckSquare, Sparkles, Flame, ShieldCheck, Eye, AlertTriangle,
  BookOpen, Hash, GraduationCap, ArrowLeft, Home, ArrowUpRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';

export const StudentDashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'discover' | 'registrations' | 'certificates' | 'leaderboard' | 'calendar' | 'profile' | 'support'>('overview');
  
  // Real-time Announcements & Notifications State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Search/Filters for Discover Events
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Selected Event for Modal Details
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Feedback Modal State
  const [feedbackReg, setFeedbackReg] = useState<any | null>(null);
  const [starRating, setStarRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuggestions, setFeedbackSuggestions] = useState('');

  // Selected Registration Pass for Detail Modal
  const [selectedPass, setSelectedPass] = useState<any | null>(null);

  // Global Calendar State
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  // Certificate Viewer Modal State
  const [viewCertificateReg, setViewCertificateReg] = useState<any | null>(null);

  // Profile Dropdown State
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const isProfileComplete = !!(
    user?.registrationNumber && 
    user?.department && 
    user?.year && 
    user?.section
  );

  // Profile Editor details state
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editDept, setEditDept] = useState('Computer Science');
  const [editYear, setEditYear] = useState('3rd');
  const [editSection, setEditSection] = useState('A');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile details state on load
  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '');
      setEditName(user.name || '');
      setEditRegNo(user.registrationNumber || '');
      setEditDept(user.department || 'Information Technology');
      setEditYear(user.year || '3rd');
      setEditSection(user.section || 'A');
      setEditPhone(user.phoneNumber || '');
    }
  }, [user]);

  // Favorites System
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(`campushub-favorites-${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavorite = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId];
      localStorage.setItem(`campushub-favorites-${user?.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        username: editUsername,
        name: editName,
        registrationNumber: editRegNo,
        department: editDept,
        year: editYear,
        section: editSection,
        phoneNumber: editPhone
      });
      if (res.data.success) {
        await refreshUser();
        alert('Profile details updated successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Support Ticket State
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const createSupportTicketMutation = useMutation({
    mutationFn: async (data: any) => api.post('/support', data),
    onSuccess: () => {
      alert('Support ticket submitted successfully! The admin will review it soon.');
      setSupportForm({ subject: '', message: '' });
      setIsSubmittingSupport(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit ticket');
      setIsSubmittingSupport(false);
    }
  });

  // Fetch Published Events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events-list', categoryFilter, difficultyFilter, searchQuery],
    queryFn: async () => {
      const res = await api.get(`/events?status=published&category=${categoryFilter}&difficulty=${difficultyFilter}&search=${searchQuery}`);
      return res.data.data;
    }
  });

  const displayedEvents = showFavoritesOnly && events
    ? events.filter((e: any) => favorites.includes(e._id))
    : events;

  // Hero Events State (must be at top level, not inside conditional render)
  const heroEvents = (events || []).slice(0, 3);
  const [heroIndex, setHeroIndex] = React.useState(0);
  
  React.useEffect(() => {
    if (heroEvents.length <= 1) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroEvents.length), 4500);
    return () => clearInterval(t);
  }, [heroEvents.length]);

  // Fetch Student's Registrations
  const { data: myRegistrations, isLoading: regsLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      const res = await api.get('/registrations/my');
      return res.data.data;
    }
  });

  // Fetch Announcements
  const { data: initAnnouncements } = useQuery({
    queryKey: ['announcements-list'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data.data;
    }
  });

  // Fetch Leaderboard Students
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // In offline mock mode, fetch users and sort them
      const res = await api.get('/auth/google-login'); // dummy to hit, let's use endpoint users
      // Create test ranking
      return [
        { username: 'Aditya Sharma', department: 'Computer Science', points: 180, badges: ['Early Bird', 'Dedicated'] },
        { username: 'Neha Roy', department: 'Information Technology', points: 140, badges: ['Socialite'] },
        { username: 'Siddharth Sen', department: 'Computer Science', points: 120, badges: ['Elite'] },
        { username: 'Vikram Mehta', department: 'Mechanical Engineering', points: 90, badges: [] },
        { username: 'Priya Verma', department: 'Biotechnology', points: 70, badges: [] }
      ];
    }
  });

  // Hook initial announcements
  useEffect(() => {
    if (initAnnouncements) {
      setAnnouncements(initAnnouncements);
    }
  }, [initAnnouncements]);

  // Fetch notifications on load
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
          setUnreadNotifsCount(res.data.data.filter((n: any) => !n.isRead).length);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  // Listen to Socket events in real-time
  useEffect(() => {
    if (!socket) return;

    // Handle real-time announcements
    socket.on('new_announcement', (ann: any) => {
      setAnnouncements((prev) => [ann, ...prev]);
      // Push mock local notification
      const newNotif = {
        _id: 'n_mock_' + Date.now(),
        title: 'New Announcement',
        message: ann.title,
        type: 'Announcement',
        createdAt: new Date().toISOString(),
        isRead: false
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadNotifsCount((prev) => prev + 1);
      // Refresh current events cache for winners
      queryClient.invalidateQueries({ queryKey: ['events-list'] });
      // Play brief notice sound or toast
    });

    // Handle user-specific notifications (like certificate ready)
    socket.on('new_notification', (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadNotifsCount((prev) => prev + 1);
      refreshUser(); // Refresh points/badges
    });

    // Handle real-time seats count adjustments
    socket.on('registration_updated', (update: any) => {
      // Refresh current events cache
      queryClient.invalidateQueries({ queryKey: ['events-list'] });
    });

    return () => {
      socket.off('new_announcement');
      socket.off('new_notification');
      socket.off('registration_updated');
    };
  }, [socket]);

  // Mark notifications as read
  const handleMarkNotifsRead = async () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (unreadNotifsCount > 0) {
      try {
        await api.post('/notifications/read');
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadNotifsCount(0);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const downloadPosterAsPDF = async (posterUrl: string, eventTitle: string) => {
    try {
      const doc = new jsPDF();
      
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = posterUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      
      const imgRatio = img.width / img.height;
      const pdfRatio = pdfWidth / pdfHeight;
      
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth / imgRatio;
      
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * imgRatio;
      }
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;
      
      doc.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
      doc.save(`${eventTitle.replace(/\s+/g, '_')}_Poster.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Failed to generate PDF poster.');
    }
  };

  // Event Registration mutation (One-Click)
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await api.post('/registrations', { eventId });
      return res.data;
    },
    onSuccess: (data) => {
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch (err) {
        console.warn('Confetti error ignored', err);
      }
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['events-list'] });
      refreshUser();
      setSelectedEvent(null);
      // Retrieve booking pass details to show success screen
      setSelectedPass(data.data);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to book event pass.');
    }
  });

  // Submit Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (payload: { regId: string, rating: number, comment: string, suggestions: string }) => {
      const res = await api.post(`/registrations/${payload.regId}/feedback`, {
        rating: payload.rating,
        comment: payload.comment,
        suggestions: payload.suggestions
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      setFeedbackReg(null);
      setFeedbackComment('');
      setFeedbackSuggestions('');
      alert('Thank you for your feedback!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    }
  });

  // Helper Countdown timer rendering
  const renderCountdown = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr).getTime();
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) return <span className="text-red-500 font-bold">Closed</span>;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return (
      <span className="text-secondary font-bold font-mono">
        {days}d {hours}h left
      </span>
    );
  };

  // Check if link can be accessed based on publish and expiry dates
  const canAccessLink = (eventObj: any) => {
    if (!eventObj?.externalLink) return false;
    const now = new Date().getTime();
    if (eventObj.linkPublishDate && now < new Date(eventObj.linkPublishDate).getTime()) return false;
    if (eventObj.linkExpiryDate && now > new Date(eventObj.linkExpiryDate).getTime()) return false;
    return true;
  };

  const isRegisteredForSelected = selectedEvent 
    ? myRegistrations?.some((r: any) => r.eventId?._id === selectedEvent._id) 
    : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Upper floating navigation */}
      <header className="h-16 border-b border-border/50 shadow-sm bg-background/95 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          title="Return to Landing Page"
        >
          <img src="/gtec_logo.png" alt="GTEC Logo" className="w-7 h-7 object-contain rounded-md" />
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm tracking-tight leading-none">Information Technology</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Student Portal</span>
          </div>
        </div>

        {/* Notifications and profile actions */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={handleMarkNotifsRead}
              className="p-2 rounded-xl bg-muted/50 border border-white/10 hover:bg-white/10 text-foreground transition relative clickable"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Dropdown notifications list */}
            {showNotifDropdown && (
              <div className="absolute -right-16 sm:right-0 mt-3 w-[85vw] sm:w-80 max-w-sm bg-card border border-muted shadow-2xl rounded-2xl p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Alerts</h4>
                  <span className="text-[10px] text-muted-foreground">{notifications.length} notifications</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className={`p-2 rounded-lg text-[11px] border ${n.isRead ? 'bg-white/[0.01] border-border/50' : 'bg-primary/10 border-primary/20'}`}>
                        <div className="font-semibold text-foreground flex justify-between">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1.5 md:pl-3 md:pr-1.5 rounded-full bg-muted/50 border border-white/10 hover:bg-white/10 transition clickable"
            >
              <span className="text-xs font-bold text-foreground hidden sm:block">{user?.username}</span>
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30">
                {(user?.username || 'U').charAt(0).toUpperCase()}
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

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Sidebar / Bottom Navigation Bar */}
        <aside className="w-full md:w-60 border-t md:border-t-0 md:border-r border-border/50 p-2 md:p-4 px-3 flex flex-row md:flex-col gap-1 md:gap-2 max-md:fixed max-md:bottom-0 max-md:left-0 max-md:z-50 max-md:bg-background/95 max-md:backdrop-blur-2xl max-md:justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none">
          {[
            { id: 'overview', label: 'Home', icon: Home },
            { id: 'discover', label: 'Discover Events', icon: Search },
            { id: 'registrations', label: 'My Events', icon: CheckSquare },
            { id: 'certificates', label: 'My Certificates', icon: ShieldCheck },
            { id: 'leaderboard', label: 'Leaderboard', icon: Award },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'support', label: 'Help & Support', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 md:px-4 text-center font-semibold rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 flex-1 md:flex-none transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                } ${(tab.id === 'profile' || tab.id === 'support' || tab.id === 'discover') ? 'max-md:hidden' : ''}`}
              >
                <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                <span className="truncate w-full text-[9px] md:text-xs mt-0.5 leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Dashboard Content panels */}
        <main className="flex-1 p-3 md:p-6 max-md:pb-24 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (() => {
            const heroEvent = heroEvents[heroIndex];

            return (
            <div className="space-y-6">
              {/* ── LIVE EVENT HERO BANNER ── */}
              {heroEvents.length > 0 && heroEvent && (
                <div
                  className="relative overflow-hidden min-h-[220px] rounded-[20px] border border-muted bg-card shadow-sm"
                >
                  {/* Background mesh gradient blobs */}
                  <div className="absolute -top-16 -left-16 w-[260px] h-[260px] rounded-full bg-primary/20 dark:bg-primary/30 blur-[80px] pointer-events-none" />
                  <div className="absolute -bottom-10 -right-10 w-[200px] h-[200px] rounded-full bg-secondary/20 dark:bg-secondary/30 blur-[80px] pointer-events-none" />
                  {/* Subtle grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                  <div className="relative z-10 p-8 flex flex-col gap-4">
                    {/* Live badge + category */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Live Now
                      </span>
                      <span className="bg-muted text-muted-foreground text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-border">
                        {heroEvent.category}
                      </span>
                      {heroEvent.difficultyLevel && (
                        <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-3 py-1 rounded-full border border-border">
                          {heroEvent.difficultyLevel}
                        </span>
                      )}
                    </div>

                    {/* Event Title */}
                    <div>
                      <h2 className="text-foreground text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-1">
                        {heroEvent.title}
                      </h2>
                      <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        {heroEvent.description?.slice(0, 100)}{heroEvent.description?.length > 100 ? '…' : ''}
                      </p>
                    </div>

                    {/* Meta info row */}
                    <div className="flex items-center gap-5 flex-wrap text-muted-foreground text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {heroEvent.date}
                      </span>
                      {heroEvent.time && (
                        <span className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {heroEvent.time}
                        </span>
                      )}
                      {heroEvent.venue && (
                        <span className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {heroEvent.venue}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {heroEvent.availableSeats ?? heroEvent.maxCapacity} seats left
                      </span>
                    </div>

                    {/* CTA + dot nav */}
                    <div className="flex items-center gap-4 mt-1">
                      <button
                        onClick={() => { setSelectedEvent(heroEvent); setActiveTab('discover'); }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-primary/20"
                      >
                        View & Register
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>

                      {/* Carousel dot indicators */}
                      {heroEvents.length > 1 && (
                        <div className="flex gap-1.5 items-center">
                          {heroEvents.map((_: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => setHeroIndex(i)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile stats cards */}
              <div className="grid grid-cols-3 gap-2 md:gap-6">
                <SpotlightCard className="p-3 md:p-6 glassmorphism-card flex flex-col md:flex-row items-center md:justify-between gap-1 md:gap-0 text-center md:text-left" glowColor="rgba(20, 184, 166, 0.12)">
                  <div className="order-1 md:order-2 p-2 md:p-3.5 bg-primary/10 rounded-xl md:rounded-2xl border border-primary/20">
                    <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="order-2 md:order-1 flex flex-col items-center md:items-start">
                    <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      <span className="md:hidden">Points</span>
                      <span className="hidden md:inline">Participation Points</span>
                    </span>
                    <h3 className="text-sm md:text-3xl font-display font-black text-foreground mt-1">
                      {user?.participationPoints} <span className="md:hidden text-[8px]">XP</span><span className="hidden md:inline text-xl">XP</span>
                    </h3>
                    <p className="hidden md:block text-[10px] text-muted-foreground mt-1">Attend events to accumulate points</p>
                  </div>
                </SpotlightCard>

                <SpotlightCard className="p-3 md:p-6 glassmorphism-card flex flex-col md:flex-row items-center md:justify-between gap-1 md:gap-0 text-center md:text-left" glowColor="rgba(99, 102, 241, 0.12)">
                  <div className="order-1 md:order-2 p-2 md:p-3.5 bg-secondary/10 rounded-xl md:rounded-2xl border border-secondary/20">
                    <Flame className="w-4 h-4 md:w-6 md:h-6 text-secondary" />
                  </div>
                  <div className="order-2 md:order-1 flex flex-col items-center md:items-start">
                    <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      <span className="md:hidden">Streak</span>
                      <span className="hidden md:inline">Attendance Streak</span>
                    </span>
                    <h3 className="text-sm md:text-3xl font-display font-black text-foreground mt-1">
                      {user?.streak} <span className="hidden md:inline text-xl">Events</span>
                    </h3>
                    <p className="hidden md:block text-[10px] text-muted-foreground mt-1">Continuous event check-ins</p>
                  </div>
                </SpotlightCard>

                <SpotlightCard className="p-3 md:p-6 glassmorphism-card flex flex-col md:flex-row items-center md:justify-between gap-1 md:gap-0 text-center md:text-left" glowColor="rgba(16, 185, 129, 0.12)">
                  <div className="order-1 md:order-2 p-2 md:p-3.5 bg-emerald-500/10 rounded-xl md:rounded-2xl border border-emerald-500/20">
                    <Award className="w-4 h-4 md:w-6 md:h-6 text-emerald-400" />
                  </div>
                  <div className="order-2 md:order-1 flex flex-col items-center md:items-start">
                    <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      <span className="md:hidden">Badges</span>
                      <span className="hidden md:inline">Earned Badges</span>
                    </span>
                    <h3 className="text-sm md:text-3xl font-display font-black text-foreground mt-1">
                      {(user?.badges || []).length} <span className="hidden md:inline text-xl">Badges</span>
                    </h3>
                    <p className="hidden md:block text-[10px] text-muted-foreground mt-1">Achievements unlocked</p>
                  </div>
                </SpotlightCard>
              </div>


              {/* Achievements Badge Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Real-time Announcements List */}
                  <div className="border border-muted rounded-2xl p-6 bg-background shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Megaphone className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-base font-bold text-foreground tracking-tight">Campus Announcements</h3>
                    </div>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                      {announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-60">
                          <Megaphone className="w-8 h-8 text-muted-foreground mb-3" />
                          <p className="text-sm font-semibold text-muted-foreground">No recent announcements</p>
                        </div>
                      ) : (
                        announcements.map((a) => {
                          const isWinner = a.category === 'Winner';
                          const isEmergency = a.category === 'Emergency';
                          const isVenue = a.category === 'Venue Change';
                          
                          return (
                          <div key={a._id} className={`p-4 rounded-xl text-sm relative transition duration-300 hover:shadow-md bg-background border ${
                            isWinner ? 'border-l-4 border-l-yellow-500 border-y-muted border-r-muted shadow-sm' :
                            isEmergency ? 'border-l-4 border-l-red-500 border-y-muted border-r-muted shadow-sm' :
                            isVenue ? 'border-l-4 border-l-orange-500 border-y-muted border-r-muted shadow-sm' : 
                            'border-l-4 border-l-primary border-y-muted border-r-muted shadow-sm'
                          }`}>
                            <span className={`absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                              isEmergency ? 'bg-red-50 text-red-600 border border-red-100' :
                              isVenue ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              isWinner ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 
                              'bg-primary/10 text-primary border border-primary/20'
                            }`}>
                              {a.category}
                            </span>
                            
                            <div className="flex items-center gap-2 mb-2 pr-24">
                              {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                              {isEmergency && <AlertTriangle className="w-4 h-4 text-red-500" />}
                              <h4 className="font-bold text-foreground text-base leading-tight">{a.title}</h4>
                            </div>
                            
                            <p className="text-muted-foreground leading-relaxed text-xs pr-4 whitespace-pre-line bg-muted/20 p-3 rounded-lg border border-muted/50 mt-3">{a.content}</p>
                            
                            {a.eventId && (
                              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/5 inline-flex px-2.5 py-1 rounded-md border border-primary/10">
                                <span className="opacity-70">Linked Event:</span> {typeof a.eventId === 'object' ? a.eventId.title : 'Event Link'}
                              </div>
                            )}
                          </div>
                        )})
                      )}
                    </div>
                  </div>
                </div>

                {/* Badge layout panel */}
                <div className="border border-muted rounded-2xl p-6 bg-background shadow-sm h-fit">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Award className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-base font-bold text-foreground tracking-tight">Badges Shelf</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {user?.badges && user.badges.length > 0 ? (
                      user.badges.map((badge, idx) => (
                        <div key={idx} className="p-4 bg-background border border-muted shadow-sm hover:shadow-md transition-shadow rounded-2xl text-center flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="w-12 h-12 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center shadow-inner relative z-10">
                            <Award className="w-6 h-6 text-yellow-500 drop-shadow-sm" />
                          </div>
                          <span className="text-xs font-bold text-foreground leading-tight relative z-10">{badge}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex flex-col items-center justify-center py-8 opacity-60">
                        <Award className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                        <p className="text-xs font-medium text-muted-foreground text-center">No badges unlocked yet.<br/>Attend events to earn them!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}


          {/* TAB 2: DISCOVER EVENTS */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              {!isProfileComplete && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-sans">
                  <div>
                    <span className="font-bold text-amber-400 block">⚠️ Academic Profile Incomplete</span>
                    <span className="text-muted-foreground mt-0.5 block">You must fill out your Registration Number, Department, Year, and Section to unlock event registrations.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="px-4 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-600 transition shadow-md whitespace-nowrap clickable"
                  >
                    Complete Profile Now &rarr;
                  </button>
                </div>
              )}
              {/* Searching and filter configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-muted/20 border border-border/50 p-4 rounded-2xl">
                {/* Search query box */}
                <div className="relative sm:col-span-2">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search event name, details, venue..."
                    className="w-full bg-background border border-muted pl-9 pr-3 py-2 text-xs rounded-xl text-foreground outline-none focus:border-primary transition"
                  />
                </div>

                {/* Category selector */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-background border border-muted px-3 py-2 text-xs rounded-xl text-foreground outline-none focus:border-primary transition"
                >
                  <option value="All">All Categories</option>
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshop">Workshop</option>
                </select>

                {/* Difficulty selector */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="bg-background border border-muted px-3 py-2 text-xs rounded-xl text-foreground outline-none focus:border-primary transition"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>

                {/* Favorites Only Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFavoritesOnly(prev => !prev)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    showFavoritesOnly 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-background border-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 inline mr-1 ${showFavoritesOnly ? 'fill-red-400' : ''}`} />
                  Favorites Only
                </button>
              </div>

              {/* Featured / Most Recent Event Banner */}
              {!eventsLoading && displayedEvents && displayedEvents.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Featured Event
                  </h3>
                  {(() => {
                    const featuredEvent = displayedEvents[0];
                    const gradients: Record<string, string> = {
                      Technical:  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                      Cultural:   'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                      Sports:     'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                      Workshop:   'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
                    };
                    const bg = gradients[featuredEvent.category] || gradients['Technical'];

                    return (
                      <div 
                        onClick={() => setSelectedEvent(featuredEvent)}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl cursor-pointer w-full bg-card"
                      >
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: bg }} />
                        <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-md tracking-wide uppercase backdrop-blur-md">{featuredEvent.category}</span>
                              <span className="text-xs font-bold bg-secondary/20 text-secondary px-3 py-1 rounded-md tracking-wide uppercase backdrop-blur-md flex items-center gap-1"><Clock className="w-3 h-3"/> {featuredEvent.date}</span>
                            </div>
                            <div>
                              <h3 className="text-2xl md:text-3xl font-display font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{featuredEvent.title}</h3>
                              <p className="text-muted-foreground mt-2 line-clamp-2 max-w-2xl">{featuredEvent.description}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-semibold text-foreground/80">
                              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {featuredEvent.venue}</span>
                              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-secondary" /> {featuredEvent.availableSeats} Seats Left</span>
                            </div>
                          </div>
                          <button className="px-6 py-3 bg-foreground text-background font-bold rounded-xl whitespace-nowrap shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                            View Details <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Event catalog grid */}
              {eventsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : !displayedEvents || displayedEvents.length === 0 ? (
                <div className="text-center py-12 border border-border/50 rounded-2xl bg-white/[0.01]">
                  <p className="text-sm text-muted-foreground">{showFavoritesOnly ? 'You have no favorited events.' : 'No events found matching your filter criteria.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedEvents.slice(1).map((event: any, idx: number) => {
                    // Gradient fallback palettes per category
                    const gradients: Record<string, string> = {
                      Technical:  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                      Cultural:   'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                      Sports:     'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                      Workshop:   'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
                    };
                    const bg = gradients[event.category] || gradients['Technical'];

                    return (
                    <div
                      key={event._id}
                      onClick={() => setSelectedEvent(event)}
                      className="group flex flex-col bg-card border border-border/60 hover:border-primary/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                    >
                      {/* Poster Image or Top Accent Line */}
                      {event.poster ? (
                        <div className="w-full h-40 bg-muted overflow-hidden relative">
                          <img src={event.poster} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: bg }} />
                        </div>
                      ) : (
                        <div className="absolute top-0 inset-x-0 h-1.5 z-10" style={{ background: bg }} />
                      )}

                      {/* Card Body */}
                      <div className="p-6 flex flex-col flex-1 bg-background relative pt-5">
                        {/* Header: Badges & Favorite */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md tracking-wide uppercase">{event.category}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase ${
                              event.difficultyLevel === 'Advanced' ? 'bg-red-500/10 text-red-500' : 
                              event.difficultyLevel === 'Intermediate' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>{event.difficultyLevel}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(event._id, e)}
                            className="p-1.5 -mr-1.5 -mt-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors z-20 clickable"
                          >
                            <Heart className={`w-5 h-5 ${favorites.includes(event._id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                        </div>
                        {/* Date and Venue Row */}
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-3 font-medium">
                          <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                            <Clock className="w-3.5 h-3.5" /> {event.date}
                          </span>
                          <span className="flex items-center gap-1.5 truncate max-w-[50%]">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{event.venue}</span>
                          </span>
                        </div>

                        {/* Title and Desc */}
                        <h4 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2 flex-1">{event.description}</p>
                        
                        {/* Divider */}
                        <div className="w-full h-px bg-border/60 my-4" />

                        {/* Footer: Seats and Action */}
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Availability</span>
                            {event.isRegistrationOpen === false ? (
                              <span className="text-red-500 font-bold text-sm">Closed</span>
                            ) : (
                              <span className="text-emerald-500 font-bold text-sm flex items-center gap-1.5">
                                Open <span className="text-xs text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded">({event.availableSeats} left)</span>
                              </span>
                            )}
                          </div>

                          {event.isRegistrationOpen !== false && (
                            <span className="bg-foreground text-background group-hover:bg-primary group-hover:text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-1.5">
                              Book Pass <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

              )}
            </div>
          )}

          {/* TAB 3: MY REGISTRATIONS / BOOKINGS */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              {/* Discover New Events Horizontal List for Mobile */}
              <div className="mb-2 md:hidden">
                <div className="flex items-center justify-between mb-4 px-1">
                   <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-emerald-500" /> Newly Published
                   </h2>
                   <button 
                     onClick={() => setActiveTab('discover')}
                     className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-full transition-colors clickable"
                     title="Search more events"
                   >
                     <Search className="w-4 h-4" />
                   </button>
                </div>
                {displayedEvents && displayedEvents.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {displayedEvents.slice(0, 4).map((event: any) => (
                      <div 
                        key={event._id} 
                        onClick={() => { setSelectedEvent(event); setActiveTab('discover'); }}
                        className="min-w-[220px] max-w-[220px] p-4 bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 cursor-pointer hover:border-emerald-500/50 transition-all snap-center shadow-sm"
                      >
                        <h4 className="font-bold text-sm text-foreground truncate">{event.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">{event.category} &bull; {event.difficultyLevel || 'All Levels'}</p>
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> {event.date ? new Date(event.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'TBA'}</span>
                           <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-1">No new events at the moment.</p>
                )}
              </div>

              <div className="pt-2">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  Registered Events
                </h2>
                {regsLoading ? (
                  <div className="text-center py-6"><Loader /></div>
                ) : !myRegistrations || myRegistrations.length === 0 ? (
                  <div className="text-center py-12 border border-border/50 rounded-2xl bg-white/[0.01]">
                    <p className="text-sm text-muted-foreground">You have not registered for any events yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myRegistrations.map((reg: any) => (
                    <SpotlightCard
                      key={reg._id}
                      className="p-6 glassmorphism-card flex flex-col justify-between"
                      glowColor="rgba(6, 182, 212, 0.1)"
                    >
                      {reg.eventId?.poster && (
                        <div className="w-full h-32 bg-muted overflow-hidden rounded-xl mb-4">
                          <img src={reg.eventId.poster} alt={reg.eventId.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-mono text-muted-foreground">Pass ID: {reg.registrationId}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            reg.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            reg.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400'
                          }`}>{reg.status}</span>
                        </div>
                        <h4 className="text-base font-bold text-foreground">{reg.eventId?.title}</h4>
                        <span className="text-xs text-muted-foreground block mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {reg.eventId?.venue}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">Date: {reg.eventId?.date} | Time: {reg.eventId?.time}</span>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-2 justify-between items-center">
                        <div className="flex items-center gap-2">
                          {reg.attended ? (
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Attended</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not checked in yet</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPass(reg)}
                            className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition clickable"
                          >
                            View Ticket
                          </button>
                          
                          {reg.attended && !reg.feedback && (
                            <button
                              onClick={() => setFeedbackReg(reg)}
                              className="px-3.5 py-1.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/90 transition flex items-center gap-1 clickable"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Feedback
                            </button>
                          )}
                        </div>
                      </div>
                    </SpotlightCard>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* TAB 4: MY CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              {!myRegistrations || myRegistrations.filter((r: any) => r.attended).length === 0 ? (
                <div className="text-center py-16 px-6 border border-border/50 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent shadow-inner">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <Award className="w-8 h-8 text-emerald-500 opacity-80" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">No Certificates Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Attend and check into events to unlock and download your verified certificates here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {myRegistrations.filter((r: any) => r.attended).map((reg: any) => (
                    <SpotlightCard
                      key={reg._id}
                      className="p-5 md:p-6 glassmorphism-card flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-4 border border-border/50"
                      glowColor="rgba(16, 185, 129, 0.15)"
                    >
                      <div className="w-full md:w-auto flex flex-col items-start gap-1 flex-1">
                        <div className="flex items-center gap-3 w-full">
                           <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex-shrink-0 flex items-center justify-center border border-emerald-500/20 text-emerald-500 hidden sm:flex">
                             <Award className="w-5 h-5" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <h4 className="text-base md:text-xl font-bold text-foreground leading-tight truncate">{reg.eventId?.title}</h4>
                             <span className="text-xs text-muted-foreground mt-0.5 block">Verified on: {new Date(reg.attendedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                           </div>
                        </div>
                        
                        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mt-2 md:mt-1 block px-3 py-1 bg-emerald-500/10 w-fit rounded-lg border border-emerald-500/20 sm:ml-13">
                          Status: Verified Attendee
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-4 border-t border-border/50 md:border-0 md:pt-0">
                        <button
                          onClick={() => setViewCertificateReg(reg)}
                          className="flex-1 md:flex-none py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition clickable flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider border border-primary/20"
                        >
                          <Eye className="w-4 h-4" /> <span className="sm:inline">View</span>
                        </button>
                        <a
                          href={`http://localhost:5000/api/registrations/${reg._id}/certificate`}
                          className="flex-1 md:flex-none py-2 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition clickable flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider border border-emerald-500/20"
                          title="Download Certificate PDF"
                        >
                          <Download className="w-4 h-4" /> <span className="md:hidden">Download</span>
                        </a>
                      </div>
                    </SpotlightCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LEADERBOARD */}
          {activeTab === 'leaderboard' && (() => {
            const eventsWithWinners = (displayedEvents || [])
              .filter((e: any) => e.winners && e.winners.length > 0)
              .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            return (
            <div className="space-y-8">
              {/* Overall Campus XP Rank */}
              <div className="border border-border/50 rounded-2xl bg-white/[0.01] overflow-hidden shadow-lg">
                <div className="p-4 bg-muted/20 border-b border-border/50 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Award className="w-4 h-4" /> Top Participants (Campus XP Rank)
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {leaderboardData?.map((student: any, idx: number) => (
                    <div key={idx} className="p-4 flex justify-between items-center text-xs hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-4 items-center">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' :
                          idx === 1 ? 'bg-neutral-300 text-black shadow-sm' :
                          idx === 2 ? 'bg-amber-600 text-white shadow-sm' : 'bg-muted text-muted-foreground'
                        }`}>{idx + 1}</span>
                        <div>
                          <span className="font-bold text-foreground block">{student.username}</span>
                          <span className="text-[10px] text-muted-foreground">{student.department}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1.5 hidden sm:flex">
                          {student.badges.map((b: string, i: number) => (
                            <span key={i} className="text-[9px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">{b}</span>
                          ))}
                        </div>
                        <span className="font-bold text-secondary text-sm">{student.points} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Winners Section */}
              {eventsWithWinners.length > 0 && (
                <div className="mt-8 border-t border-border/50 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Recent Event Winners
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
                    {eventsWithWinners.map((event: any) => (
                      <div key={event._id} className="bg-card/50 border border-muted rounded-2xl flex flex-col overflow-hidden shadow-sm hover:border-primary/30 transition-all min-w-[260px] max-w-[260px] snap-start shrink-0">
                        {/* Compact Event Header */}
                        <div className="px-3 py-2 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-muted">
                          <h4 className="text-[11px] font-bold text-foreground truncate" title={event.title}>
                            {event.title}
                          </h4>
                        </div>
                        {/* Compact Winners List */}
                        <div className="p-2 flex flex-col gap-1">
                          {(() => {
                            const sortedWinners = [...event.winners].sort((a: any, b: any) => {
                              const pA = a.place === '1st' ? 1 : a.place === '2nd' ? 2 : 3;
                              const pB = b.place === '1st' ? 1 : b.place === '2nd' ? 2 : 3;
                              return pA - pB;
                            });
                            
                            return sortedWinners.map((winner: any, i: number) => {
                              const isFirst = winner.place === '1st';
                              const isSecond = winner.place === '2nd';
                              
                              return (
                                <div key={i} className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors ${
                                  isFirst ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 
                                  isSecond ? 'hover:bg-white/[0.02]' : 
                                  'hover:bg-white/[0.02]'
                                }`}>
                                  <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-bold text-[9px] ${
                                    isFirst ? 'bg-yellow-400 text-yellow-950 shadow-sm shadow-yellow-500/20' :
                                    isSecond ? 'bg-slate-300 text-slate-800' :
                                    'bg-orange-300 text-orange-950'
                                  }`}>
                                    {winner.place.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0 flex justify-between items-center">
                                    <div className="text-[10px] font-bold text-foreground truncate pr-2">{winner.username}</div>
                                    <div className="text-[9px] text-muted-foreground font-mono">{winner.regNo}</div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* TAB 6: CALENDAR VIEW */}
          {activeTab === 'calendar' && (() => {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); 
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const eventsByDay: Record<number, any[]> = {};
            (displayedEvents || []).forEach((e: any) => {
              if (e.date) {
                const d = new Date(e.date).getDate();
                if (!Number.isNaN(d)) {
                  if (!eventsByDay[d]) eventsByDay[d] = [];
                  eventsByDay[d].push(e);
                }
              }
            });

            return (
            <div className="p-2 md:p-8 text-center w-full max-w-5xl mx-auto flex flex-col gap-8">
              <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-2 text-center md:text-left gap-2 md:gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-display font-black text-foreground tracking-tight">Campus Calendar</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Discover upcoming workshops, hackathons, and cultural events.
                  </p>
                </div>
                <div className="hidden md:flex p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <CalendarIcon className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[380px_1fr] gap-6 md:gap-8 items-start">
                {/* Calendar Container */}
                <div className="grid grid-cols-7 gap-1 md:gap-1.5 border border-border/50 p-4 md:p-5 rounded-3xl bg-card shadow-2xl relative overflow-hidden h-fit w-full max-w-[380px] mx-auto md:sticky md:top-24">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
                  
                  {/* Calendar Header Month/Year (Optional, for context) */}
                  <div className="col-span-7 flex justify-between items-center mb-2 px-1">
                    <span className="font-bold text-foreground">{new Date(currentYear, currentMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                  </div>

                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} className="text-[9px] font-black text-muted-foreground mb-1 text-center">{d}</span>
                  ))}
                  
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8 md:h-10 w-full" />
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const dayEvents = eventsByDay[day];
                    const hasEvents = dayEvents && dayEvents.length > 0;
                    const isSelected = selectedDate === day;

                    return (
                      <div
                        key={day}
                        onClick={() => hasEvents && setSelectedDate(isSelected ? null : day)}
                        className={`h-8 md:h-10 w-full flex flex-col items-center justify-center text-xs rounded-xl transition-all relative group ${
                          isSelected 
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white font-bold scale-110 shadow-lg shadow-primary/30 border border-primary/50 z-10' 
                            : hasEvents 
                              ? 'bg-muted/40 border border-white/5 text-foreground font-bold cursor-pointer hover:bg-primary/20 hover:border-primary/40 hover:scale-105 z-0' 
                              : 'text-muted-foreground/30 pointer-events-none hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="leading-none">{day}</span>
                        {hasEvents && !isSelected && (
                          <div className="flex gap-1 mt-0.5">
                            {dayEvents.slice(0, 3).map((e: any, i: number) => (
                              <span key={i} className={`w-1 h-1 rounded-full ${e.category === 'Technical' ? 'bg-indigo-400' : e.category === 'Cultural' ? 'bg-fuchsia-400' : 'bg-emerald-400'}`}></span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Date Events List Sidebar */}
                <div className="flex flex-col gap-4 text-left">
                  <div className="p-5 bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-3xl shrink-0">
                    <h4 className="font-bold text-foreground text-sm uppercase tracking-wider text-primary mb-1">
                      {selectedDate ? new Date(currentYear, currentMonth, selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
                    </h4>
                    <p className="text-xs text-muted-foreground">{selectedDate ? `${eventsByDay[selectedDate]?.length || 0} events scheduled` : 'Click a highlighted date to view events'}</p>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[500px]">
                    {selectedDate && eventsByDay[selectedDate] && eventsByDay[selectedDate].map((e: any) => (
                      <div key={e._id} onClick={() => setSelectedEvent(e)} className="cursor-pointer">
                        <SpotlightCard className="p-5 bg-card border-border/50 rounded-3xl flex flex-col group transition-all hover:scale-[1.02]">
                          <div className="flex justify-between items-start mb-3">
                             <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                               e.category === 'Technical' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                               e.category === 'Cultural' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                               'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                             }`}>
                               {e.category}
                             </span>
                             <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {e.time}</span>
                          </div>
                          <h4 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{e.title}</h4>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {e.venue}</span>
                        </SpotlightCard>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* TAB 7: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header Card */}
              <SpotlightCard className="relative overflow-hidden p-6 md:p-8 glassmorphism-card shadow-lg border border-border/50" glowColor="rgba(139, 92, 246, 0.15)">
                {/* Background Banner for Mobile */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-purple-500/20 md:hidden pointer-events-none border-b border-white/5" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
                  {/* Avatar Section */}
                  <div className="relative mt-6 md:mt-0 group">
                    <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-full bg-gradient-to-br from-primary via-indigo-500 to-purple-600 p-1 shadow-2xl transition-transform duration-300 group-hover:scale-105 mx-auto md:mx-0">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center border-[4px] border-background relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 dark:to-white/5" />
                        <span className="text-4xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-500">
                          {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-2 rounded-full border-[4px] border-background shadow-lg">
                      <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </div>

                  <div className="flex-1 w-full flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                    {/* User Info Details */}
                    <div className="flex flex-col items-center md:items-start w-full max-w-sm">
                      <h2 className="text-2xl md:text-3xl font-display font-black text-foreground tracking-tight break-words text-center md:text-left w-full">
                        {user?.name || user?.username}
                      </h2>
                      
                      <div className="flex items-center gap-2 mt-2 mb-4 justify-center md:justify-start flex-wrap">
                        <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-lg border border-border/50">@{user?.username}</span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{user?.email}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 w-full">
                        <div className="px-3 py-1.5 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Student</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Verified</span>
                        </div>
                      </div>
                      
                      {/* Mobile Logout Button (Prominent) */}
                      <button
                        onClick={logout}
                        className="md:hidden mt-6 w-full py-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm font-bold uppercase tracking-widest text-destructive hover:bg-destructive/20 transition-all clickable flex items-center justify-center gap-2 shadow-sm"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[320px]">
                      <div className="col-span-2 bg-gradient-to-br from-card to-muted/20 border border-border/80 shadow-sm rounded-2xl p-4 flex flex-col text-left hover:border-primary/40 hover:shadow-md transition-all group">
                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-hover:text-primary/70 transition-colors mb-1.5 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" /> Department
                        </span>
                        <span className="text-sm md:text-base font-bold text-foreground truncate">{user?.department || 'N/A'}</span>
                      </div>
                      <div className="bg-gradient-to-br from-card to-muted/20 border border-border/80 shadow-sm rounded-2xl p-4 flex flex-col text-left hover:border-primary/40 hover:shadow-md transition-all group">
                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-hover:text-primary/70 transition-colors mb-1.5 flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> Reg ID
                        </span>
                        <span className="text-sm font-mono font-bold text-foreground truncate">{user?.registrationNumber || 'N/A'}</span>
                      </div>
                      <div className="bg-gradient-to-br from-card to-muted/20 border border-border/80 shadow-sm rounded-2xl p-4 flex flex-col text-left hover:border-primary/40 hover:shadow-md transition-all group">
                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-hover:text-primary/70 transition-colors mb-1.5 flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3" /> Year & Sec
                        </span>
                        <span className="text-sm font-bold text-foreground">{user?.year || '-'} • Sec {user?.section || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Form Card */}
              <SpotlightCard className="p-8 glassmorphism-card" glowColor="rgba(56, 189, 248, 0.1)">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Update your identity and academic details</p>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdateSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Username</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        required
                        className="w-full bg-background border border-border/80 shadow-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full bg-background border border-border/80 shadow-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none"
                        placeholder="Your actual name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Registration Number</label>
                      <input
                        type="text"
                        value={editRegNo}
                        onChange={(e) => setEditRegNo(e.target.value)}
                        required
                        className="w-full bg-background border border-border/80 shadow-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Department</label>
                      <input
                        type="text"
                        value="Information Technology"
                        disabled
                        className="w-full bg-muted border border-border/80 rounded-xl px-4 py-3 text-sm text-muted-foreground opacity-75 outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Academic Year & Section</label>
                      <div className="flex gap-3">
                        <select
                          value={editYear}
                          onChange={(e) => setEditYear(e.target.value)}
                          className="flex-1 bg-background border border-border/80 shadow-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none appearance-none"
                        >
                          <option value="1st">1st Year</option>
                          <option value="2nd">2nd Year</option>
                          <option value="3rd">3rd Year</option>
                          <option value="4th">4th Year</option>
                        </select>
                        <input
                          type="text"
                          value={editSection}
                          onChange={(e) => setEditSection(e.target.value)}
                          required
                          placeholder="Sec"
                          className="w-24 bg-background border border-border/80 shadow-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-sm text-foreground text-center transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Contact Phone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-background border border-border/80 shadow-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">Make sure all details are accurate for certificates.</p>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 clickable disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSavingProfile ? (
                        <>Saving Changes...</>
                      ) : (
                        <>Save Profile Changes <CheckCircle2 className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </form>
              </SpotlightCard>

              {/* Help & Support Card in Profile */}
              <button
                onClick={() => setActiveTab('support')}
                className="w-full mt-6 group flex items-center justify-between p-5 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all clickable shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-foreground">Help & Support</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Contact administration for issues</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          )}

          {/* TAB 8: SUPPORT & HELP */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="md:hidden p-2.5 rounded-2xl bg-muted/50 border border-border/50 text-foreground hover:bg-muted/80 transition clickable flex items-center justify-center shadow-sm"
                  title="Back to Profile"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 shadow-inner hidden md:flex">
                  <MessageSquare className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">Help & Support</h2>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">Submit tickets to the campus administration if you face any issues.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-3">
                  <SpotlightCard className="p-8 border border-border/50 bg-card/50 backdrop-blur-xl rounded-3xl shadow-xl" glowColor="rgba(99, 102, 241, 0.15)">
                    <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      Submit a Ticket
                    </h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setIsSubmittingSupport(true);
                      createSupportTicketMutation.mutate(supportForm);
                    }} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Subject</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Certificate not generated"
                          className="w-full bg-background/50 border border-border/50 px-5 py-3.5 text-sm rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          value={supportForm.subject}
                          onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Issue Details</label>
                        <textarea
                          required
                          placeholder="Describe your issue in detail..."
                          className="w-full bg-background/50 border border-border/50 px-5 py-4 text-sm rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[160px] resize-y font-medium leading-relaxed"
                          value={supportForm.message}
                          onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingSupport}
                        className="w-full py-4 bg-primary text-primary-foreground text-sm font-black rounded-2xl hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none mt-2"
                      >
                        {isSubmittingSupport ? 'Submitting...' : 'Submit Issue'}
                      </button>
                    </form>
                  </SpotlightCard>
                </div>
                
                {/* Side Information Area */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-widest pl-2">Need Immediate Help?</h3>
                  <div className="space-y-4">
                    <div className="p-5 rounded-3xl border border-border/50 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl mt-0.5 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Technical Issues</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">If you can't log in or register for an event, make sure you are using your official college email. If the problem persists, submit a ticket.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 rounded-3xl border border-border/50 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl mt-0.5 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Missing Certificates</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">Certificates are issued only to students whose attendance was successfully verified by the scanner during the event.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 rounded-3xl border border-border/50 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-fuchsia-500/10 rounded-xl mt-0.5 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-500"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Points & Badges</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">Points take up to 24 hours to sync after an event concludes. Badges are awarded automatically at the end of the semester.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <SpotlightCard className="w-full max-w-2xl p-8 bg-[#13131a] border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto rounded-3xl" glowColor="rgba(99, 102, 241, 0.2)">
            
            <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 p-2 bg-muted/50 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white mb-4 pr-12 leading-tight">{selectedEvent.title}</h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-md border border-indigo-500/30 tracking-wide uppercase">{selectedEvent.category}</span>
              <span className="text-xs font-bold bg-fuchsia-500/20 text-fuchsia-400 px-3 py-1.5 rounded-md border border-fuchsia-500/30 tracking-wide uppercase">{selectedEvent.difficultyLevel}</span>
            </div>

            {selectedEvent.poster && (
              <div className="mb-6 group relative">
                <img src={selectedEvent.poster} alt={selectedEvent.title} className="w-full h-64 object-cover rounded-2xl border border-white/10 shadow-lg" />
                <button
                  onClick={() => downloadPosterAsPDF(selectedEvent.poster, selectedEvent.title)}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold rounded-2xl"
                >
                  <Download className="w-6 h-6" />
                  Download Poster as PDF
                </button>
              </div>
            )}

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-8 font-medium">{selectedEvent.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-y border-white/10 py-6 mb-8 text-sm bg-white/[0.02] rounded-2xl p-6">
              <div className="space-y-1.5">
                <span className="text-neutral-500 block text-[10px] uppercase font-black tracking-widest">Venue & Place</span>
                <span className="font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /> {selectedEvent.venue}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-neutral-500 block text-[10px] uppercase font-black tracking-widest">Date & Time</span>
                <span className="font-bold text-white flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-fuchsia-400" /> {selectedEvent.date} at {selectedEvent.time}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-neutral-500 block text-[10px] uppercase font-black tracking-widest">Remaining Seats</span>
                <span className="font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" /> 
                  <span className={selectedEvent.availableSeats <= 10 ? 'text-red-400' : 'text-emerald-400'}>{selectedEvent.availableSeats}</span> / {selectedEvent.maxCapacity}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-neutral-500 block text-[10px] uppercase font-black tracking-widest">Registration Countdown</span>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> {renderCountdown(selectedEvent.registrationDeadline)}</div>
              </div>
              
              {selectedEvent.externalLink && isRegisteredForSelected && canAccessLink(selectedEvent) && (
                <div className="space-y-1.5 sm:col-span-2">
                  <span className="text-neutral-500 block text-[10px] uppercase font-black tracking-widest">Event Link</span>
                  <a href={selectedEvent.externalLink} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 hover:underline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {selectedEvent.externalLink}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-8 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
              <h4 className="font-bold text-white text-sm flex items-center gap-2"><CheckSquare className="w-4 h-4 text-indigo-400" /> Faculty Coordinator</h4>
              <p className="text-neutral-400 text-xs pl-6">{selectedEvent.facultyCoordinator?.username} &bull; <a href={`mailto:${selectedEvent.facultyCoordinator?.email}`} className="text-indigo-400 hover:underline">{selectedEvent.facultyCoordinator?.email}</a></p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-3.5 bg-muted/50 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors text-center"
              >
                Close Details
              </button>
              
              {selectedEvent.externalLink && isRegisteredForSelected && canAccessLink(selectedEvent) && (
                <a
                  href={selectedEvent.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 text-sm font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-2"
                >
                  Go to Event Link
                </a>
              )}
              {selectedEvent.isRegistrationOpen === false ? (
                <button
                  disabled
                  className="flex-1 py-3.5 text-sm font-black tracking-wide bg-red-600/50 text-white rounded-xl cursor-not-allowed text-center"
                >
                  Registration Closed
                </button>
              ) : isProfileComplete ? (
                <button
                  onClick={() => registerMutation.mutate(selectedEvent._id)}
                  disabled={registerMutation.isPending || selectedEvent.availableSeats <= 0}
                  className="flex-1 py-3.5 text-sm font-black tracking-wide bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/25 clickable disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  {registerMutation.isPending ? 'Booking Pass...' : 'Confirm Registration (1-Click)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null);
                    setActiveTab('profile');
                    alert('Please complete your academic profile (Registration number, department, year, and section) before registering for college events.');
                  }}
                  className="flex-1 py-2.5 text-xs font-bold bg-primary/15 text-primary border border-primary/25 hover:bg-primary/25 rounded-xl transition clickable"
                >
                  Complete Profile to Register
                </button>
              )}
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* BOOKING SUCCESS & PASS PREVIEW MODAL */}
      {selectedPass && (
        <div className="fixed inset-0 w-full h-full bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <SpotlightCard className="w-full max-w-sm p-6 !bg-background border border-emerald-500/20 shadow-2xl relative text-center" glowColor="rgba(16, 185, 129, 0.15)">
            <div className="p-3 bg-emerald-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground">Successfully Registered!</h3>
            <p className="text-xs text-muted-foreground mt-2">Use this code for attendance check-in</p>

            {/* Ticket Graphic card */}
            <div className="my-6 p-4 border border-dashed border-muted rounded-xl bg-muted/30">
              <span className="text-[9px] font-mono text-muted-foreground block uppercase">Registration Code</span>
              <span className="text-xl font-bold text-emerald-400 font-mono my-4 block">{selectedPass.registrationId}</span>
              
              <span className="text-xs font-bold text-foreground block">{selectedPass.eventId?.title || 'Event details'}</span>
              <span className="text-[10px] text-muted-foreground block mt-1">Date: {selectedPass.eventId?.date} | Place: {selectedPass.eventId?.venue}</span>
              
              {selectedPass.eventId?.externalLink && canAccessLink(selectedPass.eventId) && (
                <div className="mt-4 pt-4 border-t border-dashed border-muted">
                  <a 
                    href={selectedPass.eventId?.externalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Open Online Event Link
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPass(null)}
                className="flex-1 py-2.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition"
              >
                Done
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/90 transition flex items-center justify-center gap-1.5 clickable"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </SpotlightCard>
        </div>
      )}


      {/* FEEDBACK MODAL */}
      {feedbackReg && (
        <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <SpotlightCard className="w-full max-w-md p-6 !bg-background border border-muted shadow-2xl relative" glowColor="rgba(6, 182, 212, 0.15)">
            <h3 className="text-lg font-display font-bold text-foreground">Submit Event Feedback</h3>
            <p className="text-xs text-muted-foreground">Share your experience at <strong>{feedbackReg.eventId?.title}</strong></p>

            <form onSubmit={(e) => {
              e.preventDefault();
              feedbackMutation.mutate({
                regId: feedbackReg._id,
                rating: starRating,
                comment: feedbackComment,
                suggestions: feedbackSuggestions
              });
            }} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Event Rating</label>
                <div className="flex gap-2 justify-center py-2 bg-muted/20 border border-border/50 rounded-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star className={`w-7 h-7 ${star <= starRating ? 'text-yellow-500 fill-current' : 'text-neutral-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Comments / Thoughts</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  required
                  placeholder="What did you enjoy the most?"
                  rows={3}
                  className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Suggestions for Improvement</label>
                <textarea
                  value={feedbackSuggestions}
                  onChange={(e) => setFeedbackSuggestions(e.target.value)}
                  placeholder="How can we make this event better next time?"
                  rows={2}
                  className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackReg(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackMutation.isPending}
                  className="flex-1 py-2 text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/95 rounded-xl transition shadow-md shadow-secondary/20 clickable"
                >
                  {feedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </SpotlightCard>
        </div>
      )}

      {/* CERTIFICATE VIEWER MODAL */}
      {viewCertificateReg && (() => {
        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Determine if user is a winner for this event
        let isWinner = false;
        let place = '';
        if (viewCertificateReg.eventId?.winners?.length > 0) {
          const normalize = (str: string | undefined) => str?.toString().toLowerCase().trim() || '';
          const sUser = normalize(user?.username);
          const sReg = normalize(user?.registrationNumber);
          
          const winnerMatch = viewCertificateReg.eventId.winners.find((w: any) => {
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

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-6 md:p-12 overflow-y-auto" onClick={() => setViewCertificateReg(null)}>
            <div className="w-full max-w-3xl my-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Actions bar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/70 text-sm font-medium">Certificate Preview</p>
                <div className="flex items-center gap-2">
                  <a
                    href={`http://localhost:5000/api/registrations/${viewCertificateReg._id}/certificate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                  <button onClick={() => setViewCertificateReg(null)} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              {/* Certificate Visual */}
              <div
                className="bg-white border-[6px] md:border-[12px] border-slate-900 rounded-lg p-6 md:p-12 relative overflow-hidden font-serif shadow-2xl"
              >
                {/* Inner border */}
                <div className="absolute inset-1.5 md:inset-2 border-2 border-slate-200 rounded pointer-events-none" />
                
                {/* Decorative corner accents (gold/bronze) */}
                <div className="absolute top-2 md:top-4 left-2 md:left-4 w-5 h-5 md:w-8 md:h-8 border-t-2 border-l-2 border-amber-700" />
                <div className="absolute top-2 md:top-4 right-2 md:right-4 w-5 h-5 md:w-8 md:h-8 border-t-2 border-r-2 border-amber-700" />
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 w-5 h-5 md:w-8 md:h-8 border-b-2 border-l-2 border-amber-700" />
                <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 w-5 h-5 md:w-8 md:h-8 border-b-2 border-r-2 border-amber-700" />

                {/* Subtle background watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] text-7xl md:text-[160px] font-black text-slate-900 -tracking-tighter pointer-events-none select-none">Information Technology</div>

                <div className="text-center relative z-10">
                  {/* College name */}
                  <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-5">
                    <img src="/gtec_logo.png" alt="GTEC" className="w-8 h-8 md:w-11 md:h-11 object-contain" />
                    <h2 className="text-slate-900 text-[11px] md:text-base font-sans font-extrabold tracking-wider uppercase m-0">
                      Ganadipathy Tulsi's Jain Engineering College
                    </h2>
                  </div>

                  {/* Title */}
                  <h1 className="text-amber-700 text-lg md:text-3xl tracking-widest uppercase font-serif font-bold my-4 md:my-6">
                    {isWinner ? "Certificate of Merit" : "Certificate of Participation"}
                  </h1>

                  {/* This certifies */}
                  <p className="text-slate-600 text-[10px] md:text-sm italic mb-3 md:mb-5 font-serif">
                    This is to proudly certify that
                  </p>

                  {/* Student Name */}
                  <h2 className="text-slate-900 text-2xl md:text-4xl font-bold mb-3 md:mb-6 tracking-wide font-sans">
                    {user?.name || 'Student Name'}
                  </h2>

                  <p className="text-slate-600 text-[10px] md:text-sm italic mb-2 font-serif px-4">
                    has successfully participated {isWinner ? `and secured ${place} Place` : ''} in the event
                  </p>

                  {/* Event Name */}
                  <h3 className="text-slate-900 text-sm md:text-2xl font-bold mb-3 md:mb-4 font-sans">
                    "{viewCertificateReg.eventId?.title || 'Event Name'}"
                  </h3>
                  
                  {/* Simplified details */}
                  <p className="text-slate-500 text-[9px] md:text-sm font-sans mb-6 md:mb-10 font-medium">
                    Held on {new Date(viewCertificateReg.eventId?.date || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                  {/* Footer */}
                  <div className="flex justify-between items-end mt-6 md:mt-10 px-2 md:px-5">
                    <div className="text-center">
                      <div className="h-4 md:h-7 mb-1" />
                      <div className="w-16 md:w-32 h-[1px] bg-slate-300 mb-1 md:mb-2 mx-auto" />
                      <p className="text-slate-500 text-[6px] md:text-[10px] font-bold uppercase font-sans">HOD Information Technology</p>
                    </div>
                    
                    {/* Golden seal */}
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-amber-300 to-amber-700 rounded-full flex items-center justify-center shadow-lg mx-2 shrink-0">
                      <div className="w-8 h-8 md:w-[52px] md:h-[52px] border border-dashed border-white/60 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="h-4 md:h-7 flex items-end justify-center mb-1">
                         <span className="font-serif italic text-sm md:text-2xl text-slate-900 -rotate-6 opacity-80">Verified</span>
                      </div>
                      <div className="w-16 md:w-32 h-[1px] bg-slate-300 mb-1 md:mb-2 mx-auto" />
                      <p className="text-slate-500 text-[6px] md:text-[10px] font-bold uppercase font-sans">Principal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
