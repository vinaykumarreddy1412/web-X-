import React, { useState, useEffect } from 'react';
import { fetchAssistantPasscode, saveAssistantPasscode } from '../../services/firebaseService';
import { GlassCard } from '../common/GlassCard';
import { KeyRound, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';

export const AssistantPasscodeManager: React.FC = () => {
  const [currentKey, setCurrentKey] = useState<string>('webx2026');
  const [inputKey, setInputKey] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAssistantPasscode().then((code) => {
      setCurrentKey(code);
      setInputKey(code);
    });
  }, []);

  const generateRandomKey = () => {
    const prefixes = ['WEBX', 'ASSIST', 'SCAN', 'SPIDER', 'VOLUNTEER'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newPasscode = `${randomPrefix}-${randomNum}`;
    setInputKey(newPasscode);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setSaving(true);
    try {
      await saveAssistantPasscode(inputKey.trim());
      setCurrentKey(inputKey.trim());
      setSuccessMsg(`Assistant Key successfully updated to: ${inputKey.trim()}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.warn('Error saving assistant passcode:', e);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <GlassCard glowAccent="blue" className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">ASSISTANT PORTAL ACCESS KEY</h3>
            <p className="text-xs font-semibold text-slate-500">
              Generate or customize the password used by volunteers to access the QR scanner at <code className="text-blue-600 font-bold font-mono">/assistant</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={generateRandomKey}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Random Key</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Active Key Display */}
        <div className="md:col-span-6 bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-inner border border-slate-800">
          <div>
            <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">ACTIVE ASSISTANT KEY</p>
            <p className="text-2xl font-black tracking-wider text-amber-400 font-mono mt-0.5">{currentKey}</p>
          </div>

          <button
            type="button"
            onClick={copyToClipboard}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Key'}</span>
          </button>
        </div>

        {/* Edit / Customize Input Form */}
        <form onSubmit={handleSave} className="md:col-span-6 flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter Custom Key..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full pl-3.5 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !inputKey.trim()}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Set & Activate'}
          </button>
        </form>
      </div>
    </GlassCard>
  );
};
