import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { triggerAttendanceVibration } from '../../services/vibrationService';
import { CheckCircle2, Zap } from 'lucide-react';

interface SuccessVibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamNumber: string;
  presentCount: number;
}

export const SuccessVibrationModal: React.FC<SuccessVibrationModalProps> = ({
  isOpen,
  onClose,
  teamNumber,
  presentCount
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger Vibration API
      triggerAttendanceVibration();

      // Trigger Confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.warn('Confetti burst ignored:', e);
      }

      // Auto close after 3 seconds if assistant doesn't click
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border-2 border-emerald-500/40 animate-in zoom-in-95 duration-200">
        
        {/* Animated Checkmark Circle */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          ✓ ATTENDANCE RECORDED
        </h3>

        <div className="my-4 py-3 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-xl font-extrabold text-red-600 tracking-wider block">
            {teamNumber}
          </span>
          <p className="text-xs font-bold text-slate-600 mt-0.5">
            4 Members Processed ({presentCount} Present)
          </p>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full mb-5">
          <Zap className="w-3.5 h-3.5" />
          <span>Haptic Vibration Feedback Triggered</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
        >
          Scan Next Team
        </button>

      </div>
    </div>
  );
};
