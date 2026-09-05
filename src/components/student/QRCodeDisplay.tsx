import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface QRCodeDisplayProps {
  qrToken: string;
  teamNumber: string;
  teamName: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrToken, teamNumber, teamName }) => {
  const downloadQR = () => {
    const svg = document.getElementById('team-qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 80;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(`WEB X • ${teamNumber} • ${teamName}`, canvas.width / 2, canvas.height - 25);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `WebX_${teamNumber}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <GlassCard glowAccent="red" className="text-center flex flex-col items-center p-6 md:p-8">
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold mb-4">
        <QrCode className="w-4 h-4" />
        <span>YOUR ATTENDANCE QR</span>
      </div>

      <p className="text-sm font-bold text-slate-800 mb-6">
        Show this QR code to the Attendance Assistant
      </p>

      {/* QR Code Container with Spiderweb Glowing Border */}
      <div className="relative p-4 rounded-3xl bg-white border-2 border-red-500/30 shadow-xl shadow-red-500/10 mb-6 group hover:scale-[1.02] transition-transform duration-300">
        <QRCodeSVG
          id="team-qr-code-svg"
          value={qrToken}
          size={240}
          level="H"
          includeMargin={true}
          fgColor="#0f172a"
        />
        <div className="mt-2 text-[10px] font-mono font-extrabold text-slate-400 tracking-wider uppercase">
          Token: {qrToken.slice(0, 16)}...
        </div>
      </div>

      <div className="flex items-center justify-center space-x-3 w-full max-w-xs">
        <button
          onClick={downloadQR}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Save QR Image</span>
        </button>
      </div>

      <div className="mt-4 flex items-center space-x-1 text-[11px] font-semibold text-emerald-600">
        <ShieldCheck className="w-4 h-4" />
        <span>Securely encrypted token (No credentials inside)</span>
      </div>
    </GlassCard>
  );
};
