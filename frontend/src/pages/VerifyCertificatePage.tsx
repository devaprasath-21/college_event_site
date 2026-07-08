import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SpotlightCard } from '../components/SpotlightCard';
import { Loader } from '../components/Loader';
import { CheckCircle2, AlertOctagon, Calendar, Award, BookOpen, ShieldCheck, Building } from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const { regId } = useParams<{ regId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/registrations/verify/${regId}`);
        if (res.data.success && res.data.verified) {
          setData(res.data.data);
        } else {
          setError('This certificate could not be verified.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Certificate verification failed.');
      } finally {
        setLoading(false);
      }
    };

    if (regId) {
      fetchVerificationDetails();
    }
  }, [regId]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[90px]" />

      {loading ? (
        <SpotlightCard className="w-full max-w-md p-8 text-center glassmorphism-card z-10">
          <Loader />
          <p className="text-xs text-muted-foreground mt-4">Verifying certificate credentials...</p>
        </SpotlightCard>
      ) : error ? (
        <SpotlightCard className="w-full max-w-md p-8 text-center glassmorphism-card z-10 border-destructive/20" glowColor="rgba(239, 68, 68, 0.15)">
          <div className="p-3 bg-destructive/10 rounded-2xl w-14 h-14 flex items-center justify-center border border-destructive/20 mx-auto mb-4">
            <AlertOctagon className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-display font-bold">Verification Failed</h2>
          <p className="text-xs text-muted-foreground mt-2 mb-6">
            The certificate registration code <strong>{regId}</strong> is invalid or does not match a verified attendee record on our servers.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition"
          >
            Go to CampusHub Home
          </button>
        </SpotlightCard>
      ) : (
        <SpotlightCard className="w-full max-w-lg p-8 glassmorphism-card z-10 border-emerald-500/20" glowColor="rgba(16, 185, 129, 0.15)">
          {/* Header Verified */}
          <div className="text-center mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-full w-14 h-14 flex items-center justify-center border border-emerald-500/20 mx-auto mb-3">
              <ShieldCheck className="w-7 h-7 text-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              CAMPUSHUB VERIFIED
            </span>
            <h2 className="text-2xl font-display font-bold mt-3">Authentic Certificate</h2>
            <p className="text-[11px] text-muted-foreground mt-1">
              Verification ID: <span className="font-mono text-foreground font-semibold">{data.registrationId}</span>
            </p>
          </div>

          <div className="space-y-4 border-t border-muted pt-6 mb-6">
            {/* Student details */}
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1 border border-primary/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Verified Recipient</span>
                <span className="text-sm font-bold text-foreground">{data.student.username}</span>
                <span className="text-xs text-muted-foreground block">
                  Reg No: {data.student.registrationNumber} ({data.student.department})
                </span>
              </div>
            </div>

            {/* Event title */}
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary mt-1 border border-secondary/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Event Participation</span>
                <span className="text-sm font-bold text-foreground">{data.event.title}</span>
                <span className="text-xs text-muted-foreground block">Category: {data.event.category}</span>
              </div>
            </div>

            {/* Event venue / time */}
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-accent/10 rounded-lg text-accent mt-1 border border-accent/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Event Conduct Details</span>
                <span className="text-xs font-semibold text-foreground">
                  Held on: {data.event.date} at {data.event.venue}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Check-in Timestamp: {new Date(data.attendedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition flex-1 clickable"
            >
              Close
            </button>
            <a
              href={`http://localhost:5000/api/registrations/${regId}/certificate`}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition text-center flex-1 clickable"
            >
              Download PDF
            </a>
          </div>
        </SpotlightCard>
      )}
    </div>
  );
};
