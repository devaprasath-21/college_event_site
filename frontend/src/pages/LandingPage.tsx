import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { SpotlightCard } from '../components/SpotlightCard';
import { 
  Sparkles, Calendar, Users, Trophy, ChevronRight, Moon, Sun, 
  MapPin, Star, Heart, ArrowUpRight, MessageSquare, Image, LogOut 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Typing Text Animation state
  const typingWords = ['Hackathons', 'Tech Symposia', 'Coding Contests', 'Cultural Fests', 'Art Expos'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Campus Visuals Carousel state
  const campusSlides = [
    { src: '/slide1.jpg', title: 'Information Technology Department', desc: 'Department of Information Technology' }
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % campusSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Statistics counters state
  const [stats, setStats] = useState({ students: 0, events: 0, venues: 0 });

  // Fetch Published Events using React Query
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['landing-events'],
    queryFn: async () => {
      const res = await api.get('/events?status=published');
      return res.data.data;
    }
  });

  // Typing effect logic
  useEffect(() => {
    let timer: any;
    const currentWord = typingWords[currentWordIndex];
    
    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayedText(currentWord.substring(0, displayedText.length - 1));
      }, 50);
    } else {
      timer = setTimeout(() => {
        setDisplayedText(currentWord.substring(0, displayedText.length + 1));
      }, 100);
    }

    if (!isDeleting && displayedText === currentWord) {
      timer = setTimeout(() => setIsDeleting(true), 1500); // Wait before delete
    } else if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex]);

  // Statistics counting logic
  useEffect(() => {
    const target = { students: 1200, events: 45, venues: 8 };
    const duration = 2000; // 2 seconds
    const intervalTime = 50;
    const steps = duration / intervalTime;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setStats({
        students: Math.min(target.students, Math.round((target.students / steps) * step)),
        events: Math.min(target.events, Math.round((target.events / steps) * step)),
        venues: Math.min(target.venues, Math.round((target.venues / steps) * step)),
      });
      
      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full relative bg-background overflow-x-hidden">
      {/* Dynamic Moving Abstract Mesh/Gradient (Simulating Hero Video Background) */}
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-float top-[-20%] left-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px] animate-float right-[-10%] bottom-[10%] [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_80%,var(--background)_100%)]" />
      </div>

      {/* Glassmorphism Floating Navigation Bar */}
      <header className="fixed top-4 inset-x-4 max-w-7xl mx-auto h-16 rounded-2xl glassmorphism z-50 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <img src="/gtec_logo.png" alt="GTEC Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="font-display font-bold tracking-tight text-lg text-foreground">Information Technology</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
          <a href="#events" className="hover:text-foreground transition-colors">Discover Events</a>
          <a href="#gallery" className="hover:text-foreground transition-colors">Gallery</a>
        </nav>

        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-foreground transition clickable"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(user?.role === 'student' ? '/dashboard' : '/admin')}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl transition shadow-md hover:bg-primary/95 clickable"
              >
                Dashboard &rarr;
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-bold rounded-xl transition shadow-md hover:scale-[1.02] clickable"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center min-h-[90vh] z-10">
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-semibold text-secondary animate-pulse mb-6">
          <Sparkles className="w-4 h-4" /> Welcome to Information Technology Event Hub
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-foreground max-w-4xl leading-[1.1]">
          Discover and Experience <br />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">
            {displayedText}
          </span>
          <span className="text-secondary font-light animate-pulse">|</span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          The college event registration platform. Track achievements, earn rankings, and claim certificates.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-neon-purple transition-all hover:scale-[1.03] text-xs clickable"
          >
            Start Registering Now
          </button>
          <a
            href="#events"
            className="px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-foreground font-bold rounded-xl transition text-xs flex items-center justify-center gap-2 clickable"
          >
            Explore Events &darr;
          </a>
        </div>

        {/* Cinematic GTEC Hero Banner */}
        <div className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group bg-neutral-900/50 aspect-[4/3] sm:aspect-video md:aspect-[21/9] animate-float">
          {campusSlides.map((slide, index) => (
            <div 
              key={index} 
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <img 
                src={slide.src} 
                alt={slide.title} 
                className={`w-full h-full object-cover opacity-90 transition-transform duration-[4000ms] ease-out ${index === currentSlide ? 'scale-105' : 'scale-100'}`} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:max-w-md p-3 md:p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-left pointer-events-none transform transition-all translate-y-0">
                <h3 className="text-sm md:text-base font-bold text-white tracking-tight leading-tight">Information Technology</h3>
                <p className="text-[9px] md:text-[10px] text-neutral-300 mt-0.5">Ganadipathy Tulsi's Jain Engineering College</p>
              </div>
            </div>
          ))}
          
          {/* Slide Indicators */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-1.5 md:gap-2 z-10">
            {campusSlides.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-secondary w-6' : 'bg-white/50 hover:bg-white'}`}
              />
            ))}
          </div>
        </div>
      </section>



      {/* Featured Events Grid Section */}
      <section id="events" className="py-20 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase block">Live Lifecycles</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mt-1">Featured Campus Events</h2>
          </div>
          <button 
            onClick={() => navigate('/login')} 
            className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1 mt-4 md:mt-0"
          >
            Explore all events <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 bg-muted rounded-2xl" />
            ))}
          </div>
        ) : !eventsData || eventsData.length === 0 ? (
          <div className="text-center p-12 glassmorphism rounded-2xl">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold">No Events Posted Yet</h3>
            <p className="text-xs text-muted-foreground mt-1">Event coordinators will publish listings shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsData.slice(0, 3).map((event: any) => (
              <div
                key={event._id}
                onClick={() => navigate('/login')}
                className="group relative rounded-3xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer bg-card flex flex-col"
              >
                {/* Top Accent Line */}
                {(() => {
                  const gradients: Record<string, string> = {
                    Technical:  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                    Cultural:   'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                    Sports:     'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                    Workshop:   'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
                  };
                  const bg = gradients[event.category] || gradients['Technical'];
                  return <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: bg }} />;
                })()}

                {/* Content Overlay */}
                <div className="p-6 pt-7 flex flex-col flex-1 relative">
                  {/* Header: Badges */}
                  <div className="flex gap-2 mb-4">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md tracking-wide uppercase">
                      {event.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase ${
                      event.difficultyLevel === 'Advanced' ? 'bg-red-500/10 text-red-500' : 
                      event.difficultyLevel === 'Intermediate' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {event.difficultyLevel}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-secondary flex items-center gap-1.5 mb-2 mt-auto">
                    <MapPin className="w-3.5 h-3.5" /> {event.venue}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {event.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-border/60 flex flex-col gap-2">
                    {event.winners && event.winners.length > 0 ? (
                      <div className="space-y-1 bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20 backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20">
                          <Trophy className="w-12 h-12 text-yellow-500" />
                        </div>
                        <div className="flex items-center gap-1.5 text-yellow-600 font-bold text-[10px] uppercase tracking-wider mb-2">
                          <Trophy className="w-3.5 h-3.5" /> Event Winners
                        </div>
                        {event.winners.map((w: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] relative z-10">
                            <span className="text-foreground font-bold">
                              {w.place === '1st' ? '🥇' : w.place === '2nd' ? '🥈' : '🥉'} {w.username}
                            </span>
                            <span className="text-muted-foreground font-medium">{w.regNo} • {w.year}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span className="font-medium">Date: {event.date}</span>
                        {event.isRegistrationOpen === false ? (
                          <span className="text-red-500 font-bold flex items-center gap-1">
                            Registration Closed
                          </span>
                        ) : (
                          <span className="text-foreground font-bold group-hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
                            Register Pass <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>



      {/* Gallery Preview Section */}
      <section id="gallery" className="py-16 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase block">Visuals</span>
          <h2 className="text-3xl font-display font-bold mt-1">Event Gallery</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* Main Images */}
          <div className="rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer shadow-md aspect-video">
            <img src="/slide1.jpg" alt="Event Highlights" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity duration-500" />
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Image className="text-white w-4 h-4" />
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer shadow-md aspect-video">
            <img src="/slide1.jpg" alt="Audience" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity duration-500" />
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Image className="text-white w-4 h-4" />
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer shadow-md aspect-video">
            <img src="/slide1.jpg" alt="Students coding" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity duration-500" />
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Image className="text-white w-4 h-4" />
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-neutral-950 py-12 border-t border-white/5 px-6 text-center text-xs text-muted-foreground z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/gtec_logo.png" alt="GTEC Logo" className="w-6 h-6 object-contain rounded-md" />
            <span className="font-display font-bold text-sm text-white">Information Technology</span>
          </div>
          <p>&copy; 2026 Information Technology. Ganadipathy Tulsi's Jain Engineering College, Department of Information Technology. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/login" className="hover:text-white transition">Admin Portal</a>
            <span>&middot;</span>
            <a href="#" className="hover:text-white transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
