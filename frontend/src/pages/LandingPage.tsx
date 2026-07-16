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

const TypingEffect: React.FC = () => {
  const typingWords = ['Hackathons', 'Tech Symposia', 'Coding Contests', 'Cultural Fests', 'Art Expos'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  return <>{displayedText}</>;
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();


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



  // Fetch Published Events using React Query
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['landing-events'],
    queryFn: async () => {
      const res = await api.get('/events?status=published&excludeCompleted=true');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to improve load time
  });



  return (
    <div className="min-h-screen w-full relative bg-background overflow-x-hidden">
      {/* Dynamic Moving Abstract Mesh/Gradient (Simulating Hero Video Background) */}
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-float top-[-20%] left-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px] animate-float right-[-10%] bottom-[10%] [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_80%,var(--background)_100%)]" />
      </div>

      {/* Glassmorphism Floating Navigation Bar */}
      <header className="fixed top-4 inset-x-4 max-w-7xl mx-auto h-16 rounded-2xl glassmorphism z-50 px-3 md:px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-1.5 md:gap-2">
          <img src="/gtec_logo.png" alt="GTEC Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain rounded-lg flex-shrink-0" />
          <span className="font-display font-bold tracking-tight text-[11px] sm:text-sm md:text-lg text-foreground leading-none whitespace-nowrap">Information Technology</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
          <a href="#events" className="hover:text-foreground transition-colors">Discover Events</a>
          <a href="#gallery" className="hover:text-foreground transition-colors">Gallery</a>
        </nav>

        <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0">
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-foreground transition clickable"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => navigate(user?.role === 'student' ? '/dashboard' : '/admin')}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground text-[10px] md:text-xs font-bold rounded-xl transition shadow-md hover:bg-primary/95 clickable whitespace-nowrap"
              >
                Dashboard &rarr;
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 md:px-5 md:py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px] md:text-xs font-bold rounded-xl transition shadow-md hover:scale-[1.02] clickable whitespace-nowrap"
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
            <TypingEffect />
          </span>
          <span className="text-secondary font-light animate-pulse">|</span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          The college event registration platform. Track achievements, and earn rankings.
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
                        <span className="font-medium">Date: {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
          <h2 className="text-3xl font-display font-bold mt-1">Post Gallery</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto items-start animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="w-full sm:w-[calc(50%-1.5rem)] md:w-[calc(50%-1.5rem)] lg:w-[calc(40%-1.5rem)] xl:w-[calc(33.333%-1.5rem)] h-[500px] bg-muted/50 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        ) : eventsData && eventsData.filter((e: any) => e.poster).length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto items-start">
            {eventsData.filter((e: any) => e.poster).map((event: any) => (
              <div key={event._id} className="w-full sm:w-[calc(50%-1.5rem)] md:w-[calc(50%-1.5rem)] xl:w-[calc(50%-1.5rem)] flex-shrink-0 relative group">
                {/* Poster Container */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/40 md:flex md:h-[280px] bg-card hover:border-primary/50 transition-colors">
                  
                  {/* Image container */}
                  <div className="relative md:w-2/5 overflow-hidden h-full flex items-center justify-center bg-muted">
                    <img src={event.poster} alt={event.title} loading="lazy" className="w-full h-auto md:h-full md:object-cover group-hover:scale-105 transition-transform duration-700" />
                    
                    {/* Overlay and Text Content - Mobile Only */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 md:hidden" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
                      <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{event.title}</h3>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2.5 py-1 rounded-md">{event.category}</span>
                        <a href={event.poster} target="_blank" rel="noreferrer" className="text-[10px] text-white hover:text-primary transition bg-black/50 p-2 rounded-full ml-auto cursor-pointer flex items-center justify-center">
                          <Image className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Details Box - Desktop Only */}
                  <div className="hidden md:flex md:w-3/5 p-6 bg-card/40 backdrop-blur-sm flex-col justify-center border-l border-border/40">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="text-[10px] font-bold bg-primary/20 text-primary px-2.5 py-1 rounded-md uppercase tracking-wider">{event.category}</span>
                       {event.difficultyLevel && <span className="text-[10px] font-medium text-muted-foreground border border-border/50 px-2.5 py-1 rounded-md">{event.difficultyLevel}</span>}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
                    <div className="space-y-2.5 mb-6">
                       <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                         <Calendar className="w-4 h-4 text-emerald-500" /> 
                         {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </p>
                       <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                         <MapPin className="w-4 h-4 text-fuchsia-500" /> 
                         <span className="truncate">{event.venue}</span>
                       </p>
                    </div>
                    <div className="mt-auto flex justify-between items-center">
                       {event.isRegistrationOpen === false ? (
                          <span className="text-red-500 font-bold text-sm bg-red-500/10 px-3 py-1.5 rounded-lg">Registration Closed</span>
                       ) : (
                          <span onClick={() => {
                            if (!isAuthenticated) navigate('/login');
                            else if (user?.role === 'student') navigate('/student');
                            else navigate('/admin');
                          }} className="text-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg">
                            Register Now <ArrowUpRight className="w-4 h-4" />
                          </span>
                       )}
                       <a href={event.poster} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                          <Image className="w-4 h-4" /> View Full
                       </a>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">No posters to display yet.</p>
          </div>
        )}
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
