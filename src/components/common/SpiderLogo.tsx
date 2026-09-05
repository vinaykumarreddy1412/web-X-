import React from 'react';

interface SpiderLogoProps {
  className?: string;
  size?: number;
}

export const SpiderLogo: React.FC<SpiderLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block transition-transform duration-300 ${className}`}
    >
      <g fill="currentColor">
        {/* Spider Head & Body */}
        <ellipse cx="250" cy="180" rx="36" ry="30" />
        <path d="M250 195 C300 230 320 330 250 430 C180 330 200 230 250 195 Z" />
        
        {/* Mandibles */}
        <path d="M230 155 Q210 120 185 115 Q220 145 235 158 Z" />
        <path d="M270 155 Q290 120 315 115 Q280 145 265 158 Z" />
        
        {/* Legs Left */}
        {/* L1 - Top */}
        <path d="M228 165 L170 85 L95 15 L70 140 L125 150 L155 95 L215 160 Z" />
        {/* L2 */}
        <path d="M220 178 L125 130 L30 95 L5 210 L65 170 L135 150 L212 178 Z" />
        {/* L3 */}
        <path d="M218 195 L115 210 L0 270 L80 340 L110 275 L145 225 L215 202 Z" />
        {/* L4 - Bottom */}
        <path d="M222 212 L145 265 L80 330 L195 495 L105 335 L160 270 L220 222 Z" />

        {/* Legs Right */}
        {/* R1 - Top */}
        <path d="M272 165 L330 85 L405 15 L430 140 L375 150 L345 95 L285 160 Z" />
        {/* R2 */}
        <path d="M280 178 L375 130 L470 95 L495 210 L435 170 L365 150 L288 178 Z" />
        {/* R3 */}
        <path d="M282 195 L385 210 L500 270 L420 340 L390 275 L355 225 L285 202 Z" />
        {/* R4 - Bottom */}
        <path d="M278 212 L355 265 L420 330 L305 495 L395 335 L340 270 L280 222 Z" />
      </g>
    </svg>
  );
};
