import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowAccent?: 'blue' | 'red' | 'purple' | 'cyan' | 'none';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowAccent = 'none',
  onClick
}) => {
  let glowClasses = 'border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-slate-300';
  if (glowAccent === 'blue') {
    glowClasses = 'border-blue-200/70 shadow-lg shadow-blue-500/10 hover:border-blue-400 hover:shadow-blue-500/20';
  } else if (glowAccent === 'red') {
    glowClasses = 'border-red-200/70 shadow-lg shadow-red-500/10 hover:border-red-400 hover:shadow-red-500/20';
  } else if (glowAccent === 'purple') {
    glowClasses = 'border-purple-200/70 shadow-lg shadow-purple-500/10 hover:border-purple-400 hover:shadow-purple-500/20';
  } else if (glowAccent === 'cyan') {
    glowClasses = 'border-cyan-200/70 shadow-lg shadow-cyan-500/10 hover:border-cyan-400 hover:shadow-cyan-500/20';
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white/80 backdrop-blur-md rounded-2xl border transition-all duration-300 p-5 md:p-6
        ${glowClasses}
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
