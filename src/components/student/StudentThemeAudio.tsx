import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Disc3 } from 'lucide-react';

export const StudentThemeAudio: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  useEffect(() => {
    // Initialize audio instance with the Guardians of the Globe Invincible theme
    const audio = new Audio('/audio/student_theme.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          console.log('Autoplay deferred pending user interaction:', err);
          setAutoplayBlocked(true);
          setIsPlaying(false);

          // Listen for first user interaction on the window to start playback smoothly
          const startOnInteraction = () => {
            if (audioRef.current && audioRef.current.paused) {
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
              }).catch(() => {});
            }
            window.removeEventListener('click', startOnInteraction);
            window.removeEventListener('touchstart', startOnInteraction);
          };

          window.addEventListener('click', startOnInteraction, { once: true });
          window.addEventListener('touchstart', startOnInteraction, { once: true });
        });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch(console.warn);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md border border-red-500/40 px-3.5 py-1.5 rounded-2xl shadow-lg shadow-red-950/30 transition-all">
      <div className="flex items-center space-x-2">
        <Disc3 className={`w-4 h-4 text-red-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-400">HACKATHON THEME</span>
          <span className="text-[9px] font-bold text-slate-300 truncate max-w-[140px]">Guardians of the Globe</span>
        </div>
      </div>

      {/* Animated Soundwave Equalizer */}
      {isPlaying && (
        <div className="flex items-end space-x-0.5 h-4 px-1.5">
          <span className="w-1 bg-red-400 rounded-full eq-bar-1"></span>
          <span className="w-1 bg-amber-400 rounded-full eq-bar-2"></span>
          <span className="w-1 bg-blue-400 rounded-full eq-bar-3"></span>
          <span className="w-1 bg-red-500 rounded-full eq-bar-1"></span>
        </div>
      )}

      <div className="flex items-center space-x-1 pl-1 border-l border-slate-700">
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
          className={`p-1.5 rounded-lg text-white font-bold text-xs transition-colors ${
            autoplayBlocked 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse text-[10px] px-2 flex items-center space-x-1' 
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : autoplayBlocked ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px] font-black">PLAY</span>
            </>
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
        </button>

        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
