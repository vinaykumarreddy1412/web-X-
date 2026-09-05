import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';
import { triggerScanVibration } from '../../services/vibrationService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (tokenOrTeam: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScannerError(null);
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    const readerElement = document.getElementById('qr-reader-container');
    if (!readerElement) return;

    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5Qrcode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5Qrcode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          triggerScanVibration();
          stopScanner();
          onScanSuccess(decodedText);
        },
        () => {
          // Scanning frame error ignored
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera launch error:', err);
      setScannerError('Camera access denied or device camera unavailable. You can also use Manual Team Search.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-red-400 animate-pulse" />
            <h3 className="text-base font-black tracking-wide">SCAN TEAM QR CODE</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-950 min-h-[320px] flex flex-col items-center justify-center relative">
          <div id="qr-reader-container" className="w-full max-w-[300px] overflow-hidden rounded-2xl border-2 border-red-500/50 shadow-lg"></div>

          {isScanning && (
            <p className="text-xs font-bold text-slate-300 mt-4 tracking-wider uppercase animate-pulse">
              Align QR Code within the viewfinder
            </p>
          )}

          {scannerError && (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-semibold space-y-3 text-center max-w-xs">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p>{scannerError}</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs inline-flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-medium">
            System will automatically identify team and load 4-student roster upon scan.
          </p>
        </div>

      </div>
    </div>
  );
};
