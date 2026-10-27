import React, { useState } from 'react';
import { X, Key, HelpCircle, Check, Volume2, Image, ShieldAlert, Sparkles, Terminal } from 'lucide-react';

interface ApiDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDiagnosticsModal: React.FC<ApiDiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const [testTonePlaying, setTestTonePlaying] = useState(false);

  if (!isOpen) return null;

  // Test speaker sound generator (verifies browser speaker is unmuted)
  const playTestChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      setTestTonePlaying(true);

      const notes = [440, 554.37, 659.25, 880]; // A major chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.7);
      });

      setTimeout(() => setTestTonePlaying(false), 1200);
    } catch {
      setTestTonePlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Diagnóstico, Fotos & Configuración de APIs</h2>
              <p className="text-xs text-slate-400">Todo lo que necesitas saber sobre cómo hacer funcionar la app al 100%</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: How to send screenshots */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Image className="w-4 h-4" />
            <span>¿Cómo puedes enviarme fotos o capturas?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            1. En la caja de chat donde me escribes, puedes <strong>pegar una captura de pantalla directamente presionando Ctrl + V (o Cmd + V en Mac)</strong>.<br />
            2. También puedes arrastrar la imagen directamente sobre la caja del chat.<br />
            3. Si tu navegador no te permite pegar imágenes, simplemente describe qué ocurre en pantalla: ¿se queda en silencio, sale un mensaje de error, o la barra no avanza?
          </p>
        </div>

        {/* Section 2: Audio Engine and System Status */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Motor de Audio y Seguridad JMMUSIC</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Todas las conexiones se procesan de forma segura a través de los servidores internos y la Web Audio API nativa. No requiere claves manuales ni configuraciones externas.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              ✓ DSP 10-Bandas Activo
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold">
              ✓ Modo Seguro HTTPS / CORS Protegido
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold">
              ✓ Caché Offline IndexedDB
            </span>
          </div>
        </div>

        {/* Section 3: Hardware Audio Speaker Test */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Probar Altavoces / Auriculares</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Genera un tono melódico directo para comprobar si el sonido de tu equipo está activo.
            </p>
          </div>
          <button
            onClick={playTestChime}
            disabled={testTonePlaying}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            {testTonePlaying ? 'Sonando...' : 'Emitir Tono'}
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
