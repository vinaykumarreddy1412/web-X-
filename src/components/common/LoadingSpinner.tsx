import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-14 h-14">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-blue-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
        {/* Inner spider node */}
        <div className="absolute inset-2 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin duration-750"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-slate-800">X</span>
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">{label}</p>
    </div>
  );
};
