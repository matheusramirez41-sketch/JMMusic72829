import React from 'react';
import { X, Check, AlertCircle, Sparkles, Trophy, Lightbulb, Compass } from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1">
              <Trophy className="w-3.5 h-3.5" />
              Análisis Estratégico de Producto
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              ¿Copiar a Spotify / YT Music o crear algo nuevo y hermoso?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verdict Callout */}
        <div className="rounded-2xl bg-indigo-950/40 border border-indigo-500/30 p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            La Recomendación de Experto: El enfoque "Híbrido de Oro"
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Si te copias al 100%, <strong>heredas sus peores defectos</strong> (publicidad abrumadora, exceso de podcasts, interfaces saturadas y lentas). Pero si inventas una interfaz completamente extravagante, el usuario se perderá.
            <br />
            <strong>La fórmula ganadora:</strong> Mantener los controles universales familiares (play, barra de avance, cola de canciones) y <strong>superarlos brutalmente</strong> en estética visual, inmersión auditiva y cero distracciones.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden text-xs sm:text-sm">
          <div className="grid grid-cols-4 bg-slate-950/80 p-3.5 border-b border-slate-800 font-semibold text-slate-200">
            <div>Factor</div>
            <div>Spotify</div>
            <div>Otras Plataformas</div>
            <div className="text-indigo-400">JMMUSIC Master Hi-Fi</div>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-4 p-3.5 border-b border-slate-800/60 bg-slate-900/30 items-center">
            <div className="font-medium text-slate-300">Enfoque Principal</div>
            <div className="text-slate-400">Podcasts + Videos TikTok</div>
            <div className="text-slate-400">Publicidad y feeds saturados</div>
            <div className="text-indigo-300 font-medium">100% Música Pura & Fidelidad</div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 p-3.5 border-b border-slate-800/60 bg-slate-900/50 items-center">
            <div className="font-medium text-slate-300">Estética Visual</div>
            <div className="text-slate-400">Cards oscuras rígidas</div>
            <div className="text-slate-400">Layout básico genérico</div>
            <div className="text-indigo-300 font-medium">Mesh gradients dinámicos reactivos</div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-4 p-3.5 border-b border-slate-800/60 bg-slate-900/30 items-center">
            <div className="font-medium text-slate-300">Letras en Vivo</div>
            <div className="text-slate-400">Básicas con scroll lento</div>
            <div className="text-slate-400">Texto estático / desincronizado</div>
            <div className="text-indigo-300 font-medium">Karaoke interactivo con salto por clic</div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-4 p-3.5 bg-slate-900/50 items-center">
            <div className="font-medium text-slate-300">Audio DSP & Calidad</div>
            <div className="text-slate-400">Ecualizador oculto y comprimido</div>
            <div className="text-slate-400">Sin presets avanzados nativos</div>
            <div className="text-indigo-300 font-medium">Web Audio API con presets en vivo</div>
          </div>
        </div>

        {/* 3 Pillars for the User */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1">1. Intuitivo</h4>
            <p className="text-xs text-slate-400">Nadie necesita manual para darle Play, pausar o crear una playlist.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1">2. Visualmente Hipnótico</h4>
            <p className="text-xs text-slate-400">La interfaz respira con los colores de cada álbum como una obra de arte.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1">3. Cero Relleno Basura</h4>
            <p className="text-xs text-slate-400">Sin anuncios ruidosos, sin contenido irrelevante, sin algoritmo invasivo.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
          >
            Explorar la Experiencia
          </button>
        </div>
      </div>
    </div>
  );
};
