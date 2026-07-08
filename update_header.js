const fs = require('fs');

const file = 'frontend/src/pages/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldHeader = `              {/* Header Card */}
              <SpotlightCard className="p-8 glassmorphism-card flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left" glowColor="rgba(139, 92, 246, 0.15)">
                <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center border-4 border-background">
                    <span className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-500">
                      {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-black text-foreground tracking-tight">{user?.name || user?.username}</h2>
                  <span className="text-sm text-primary font-semibold block mt-1">{user?.email}</span>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student</span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-400">Verified</span>
                  </div>
                </div>
              </SpotlightCard>`;

const newHeader = `              {/* Header Card */}
              <SpotlightCard className="p-8 glassmorphism-card flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left shadow-lg border border-border/50" glowColor="rgba(139, 92, 246, 0.15)">
                <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center border-4 border-background">
                    <span className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-500">
                      {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                    <div>
                      <h2 className="text-2xl font-display font-black text-foreground tracking-tight flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start">
                        {user?.name || user?.username}
                        <span className="text-sm font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border">@{user?.username}</span>
                      </h2>
                      <span className="text-sm text-primary font-semibold block mt-1">{user?.email}</span>
                      <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                        <span className="px-2.5 py-1 rounded-md bg-foreground/5 border border-foreground/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student</span>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Verified</span>
                      </div>
                    </div>

                    <div className="text-center md:text-right bg-muted/20 p-5 rounded-2xl border border-border shadow-inner min-w-[240px]">
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-2">Academic Profile</span>
                      <span className="block text-sm font-bold text-foreground mt-2">{user?.department || 'Department N/A'}</span>
                      <span className="block text-xs font-medium text-muted-foreground mt-1">{user?.year || '-'} Year &bull; Section {user?.section || '-'}</span>
                      <span className="block text-[11px] font-mono font-bold text-muted-foreground mt-3 bg-background py-1.5 rounded-lg border border-border shadow-sm">ID: {user?.registrationNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>`;

content = content.replace(oldHeader, newHeader);

// Fix inputs visibility
content = content.replace(/bg-background\/50 backdrop-blur-sm border border-white\/10/g, 'bg-background border border-border/80 shadow-sm');
content = content.replace(/bg-white\/5/g, 'bg-muted/50');
content = content.replace(/border-white\/5/g, 'border-border/50');

fs.writeFileSync(file, content, 'utf8');
