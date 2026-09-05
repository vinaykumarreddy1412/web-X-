import React from 'react';

interface SpidermanAvatarProps {
  size?: number;
  className?: string;
}

export const SpidermanAvatar: React.FC<SpidermanAvatarProps> = ({ size = 44, className = '' }) => {
  return (
    <div 
      style={{ width: size, height: size }}
      className={`relative rounded-2xl overflow-hidden shadow-lg p-0.5 bg-gradient-to-tr from-red-600 via-rose-500 to-blue-600 shadow-red-500/25 shrink-0 ${className}`}
    >
      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="bgAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4"/>
              <stop offset="60%" stopColor="#EC4899" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="suitRedGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EF4444"/>
              <stop offset="100%" stopColor="#B91C1C"/>
            </linearGradient>
            <linearGradient id="suitBlueGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563EB"/>
              <stop offset="100%" stopColor="#1D4ED8"/>
            </linearGradient>
          </defs>

          {/* Background Aura */}
          <circle cx="100" cy="100" r="95" fill="url(#bgAura)"/>

          {/* Blue Shoulders */}
          <path d="M25 185 C25 145 55 130 75 125 L100 150 L125 125 C145 130 175 145 175 185 Z" fill="url(#suitBlueGrad)"/>
          
          {/* Red Chest */}
          <path d="M65 138 C75 125 85 118 100 118 C115 118 125 125 135 138 L115 185 L85 185 Z" fill="url(#suitRedGrad)"/>
          
          {/* Chest Web & Emblem */}
          <path d="M100 118 L100 185 M80 132 L120 132 M70 152 L130 152 M75 170 L125 170" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round"/>
          <ellipse cx="100" cy="148" rx="3.5" ry="4.5" fill="#0f172a"/>
          <path d="M97 146 Q88 140 85 136 M97 148 Q88 148 84 150 M103 146 Q112 140 115 136 M103 148 Q112 148 116 150" stroke="#0f172a" strokeWidth="1.3" strokeLinecap="round"/>

          {/* Neck */}
          <path d="M84 94 L84 122 C90 126 110 126 116 122 L116 94 Z" fill="url(#suitRedGrad)"/>

          {/* Mask Base */}
          <ellipse cx="100" cy="76" rx="42" ry="50" fill="url(#suitRedGrad)"/>

          {/* Mask Web Pattern */}
          <g stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
            <path d="M100 26 L100 126"/>
            <path d="M100 76 L65 40"/>
            <path d="M100 76 L135 40"/>
            <path d="M100 76 L58 76"/>
            <path d="M100 76 L142 76"/>
            <path d="M100 76 L65 112"/>
            <path d="M100 76 L135 112"/>
            <path d="M80 48 Q100 40 120 48 Q130 76 120 104 Q100 112 80 104 Q70 76 80 48" fill="none"/>
            <path d="M88 60 Q100 54 112 60 Q118 76 112 92 Q100 98 88 92 Q82 76 88 60" fill="none"/>
          </g>

          {/* Left Eye */}
          <path d="M68 60 C74 52 90 66 94 80 C88 86 74 84 68 74 C65 69 66 63 68 60 Z" fill="#0f172a"/>
          <path d="M71 63 C76 56 88 68 91 78 C86 83 76 81 71 73 C69 69 70 65 71 63 Z" fill="#FFFFFF"/>

          {/* Right Eye */}
          <path d="M132 60 C126 52 110 66 106 80 C112 86 126 84 132 74 C135 69 134 63 132 60 Z" fill="#0f172a"/>
          <path d="M129 63 C124 56 112 68 109 78 C114 83 124 81 129 73 C131 69 130 65 129 63 Z" fill="#FFFFFF"/>
        </svg>
      </div>
    </div>
  );
};
