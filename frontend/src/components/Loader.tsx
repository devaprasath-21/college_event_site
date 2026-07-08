import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative w-16 h-16">
        {/* Outer Pulsing Glow */}
        <div className="absolute top-0 left-0 w-full h-full rounded-full bg-primary/20 animate-ping" />
        {/* Middle Rotating Border */}
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-transparent border-t-primary border-r-secondary animate-spin" />
        {/* Inner static dot */}
        <div className="absolute top-2 left-2 w-12 h-12 rounded-full bg-background border border-muted flex items-center justify-center">
          <span className="w-3 h-3 bg-secondary rounded-full animate-pulse-glow" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading CampusHub...</p>
    </div>
  );
};

export const ScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full z-[999] bg-background flex flex-col items-center justify-center">
      <Loader />
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="border border-white/5 rounded-2xl p-6 bg-white/[0.01] animate-pulse">
      <div className="w-full h-40 bg-muted rounded-xl mb-4" />
      <div className="h-6 bg-muted rounded-md w-3/4 mb-3" />
      <div className="h-4 bg-muted rounded-md w-1/2 mb-6" />
      <div className="flex justify-between items-center">
        <div className="h-8 bg-muted rounded-lg w-24" />
        <div className="h-8 bg-muted rounded-lg w-20" />
      </div>
    </div>
  );
};
