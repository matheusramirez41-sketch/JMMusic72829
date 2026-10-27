import React, { useRef, useEffect, useState } from 'react';
import { audioEngine } from './AudioEngine';
import { Activity, Radio, Waves, Disc3, Sparkles } from 'lucide-react';

export type VisualizerMode = 'bars' | 'wave' | 'ring' | 'off';

interface AudioVisualizerProps {
  isPlaying: boolean;
  accentColor?: string;
  height?: number;
  className?: string;
  initialMode?: VisualizerMode;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  accentColor = '#6366f1',
  height = 54,
  className = '',
  initialMode = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>(initialMode);
  const animFrameRef = useRef<number | null>(null);

  // Cycle mode on click
  const cycleMode = () => {
    setMode((current) => {
      if (current === 'bars') return 'wave';
      if (current === 'wave') return 'ring';
      if (current === 'ring') return 'off';
      return 'bars';
    });
  };

  useEffect(() => {
    if (mode === 'off' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      if (!isPlaying) {
        // Subtle resting baseline
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        if (mode === 'bars') {
          const barCount = 24;
          const barWidth = (width - barCount * 3) / barCount;
          for (let i = 0; i < barCount; i++) {
            ctx.fillRect(i * (barWidth + 3), h - 4, barWidth, 4);
          }
        } else if (mode === 'wave') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(width, h / 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(width / 2, h / 2, Math.min(width, h) * 0.35, 0, Math.PI * 2);
          ctx.stroke();
        }
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      phase += 0.06;
      const freqData = audioEngine.get10BandFrequencyData();

      if (mode === 'bars') {
        const barCount = 28;
        const spacing = 3;
        const barWidth = Math.max(3, (width - (barCount - 1) * spacing) / barCount);

        const gradient = ctx.createLinearGradient(0, h, 0, 0);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(0.65, '#a855f7');
        gradient.addColorStop(1, '#38bdf8');

        for (let i = 0; i < barCount; i++) {
          const bandIndex = Math.min(freqData.length - 1, Math.floor((i / barCount) * freqData.length));
          const energy = freqData[bandIndex] || 50;
          const dynamicWave = Math.sin(phase + i * 0.32) * 12;
          const heightFactor = Math.max(0.12, Math.min(1.0, (energy + dynamicWave) / 100));
          const barHeight = Math.max(4, heightFactor * (h - 6));

          const x = i * (barWidth + spacing);
          const y = h - barHeight;

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // High frequency cap glow
          if (barHeight > h * 0.45) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y - 2, barWidth, 1.5);
          }
        }
      } else if (mode === 'wave') {
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#06b6d4');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();

        const points = 40;
        const slice = width / points;

        for (let i = 0; i <= points; i++) {
          const bandIndex = Math.min(freqData.length - 1, Math.floor((i / points) * freqData.length));
          const energy = freqData[bandIndex] || 50;
          const sinAmp = (energy / 100) * (h * 0.36);
          const y = h / 2 + Math.sin(phase * 1.5 + i * 0.35) * sinAmp + Math.cos(phase * 0.8 + i * 0.2) * (sinAmp * 0.4);

          if (i === 0) {
            ctx.moveTo(0, y);
          } else {
            ctx.lineTo(i * slice, y);
          }
        }
        ctx.stroke();

        // Secondary subtle wave
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const y = h / 2 + Math.sin(phase * 1.8 + i * 0.45 + 1.2) * (h * 0.22);
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * slice, y);
        }
        ctx.stroke();
      } else if (mode === 'ring') {
        const centerX = width / 2;
        const centerY = h / 2;
        const radius = Math.min(width, h) * 0.35;
        const numRays = 32;

        for (let i = 0; i < numRays; i++) {
          const angle = (i / numRays) * Math.PI * 2 + phase * 0.2;
          const bandIndex = i % freqData.length;
          const energy = freqData[bandIndex] || 50;
          const rayLen = 4 + (energy / 100) * 14;

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + rayLen);
          const y2 = centerY + Math.sin(angle) * (radius + rayLen);

          ctx.strokeStyle = i % 2 === 0 ? accentColor : '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mode, isPlaying, accentColor]);

  if (mode === 'off') {
    return (
      <div className={`flex items-center justify-center py-1 ${className}`}>
        <button
          onClick={cycleMode}
          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 hover:text-indigo-400 bg-slate-900/60 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1"
          title="Activar visualizador de audio en vivo"
        >
          <Activity className="w-3 h-3" />
          <span>Activar Visualizador Neón</span>
        </button>
      </div>
    );
  }

  const modeLabels: Record<VisualizerMode, { label: string; icon: any }> = {
    bars: { label: 'Barras Neón', icon: Activity },
    wave: { label: 'Onda Líquida', icon: Waves },
    ring: { label: 'Pulso Estelar', icon: Disc3 },
    off: { label: 'Desactivado', icon: Radio }
  };

  const CurrentIcon = modeLabels[mode].icon;

  return (
    <div className={`relative group w-full flex flex-col items-center select-none ${className}`}>
      <div
        onClick={cycleMode}
        className="w-full cursor-pointer relative rounded-xl overflow-hidden bg-slate-950/60 border border-white/5 hover:border-indigo-500/30 transition-all p-1.5 flex items-center justify-center"
        title="Toca para cambiar de estilo: Barras, Onda o Pulso"
      >
        <canvas
          ref={canvasRef}
          width={360}
          height={height}
          className="w-full h-auto block"
        />

        {/* Floating minimal indicator pill */}
        <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[9px] font-bold text-indigo-300 flex items-center gap-1">
          <CurrentIcon className="w-2.5 h-2.5" />
          <span>{modeLabels[mode].label}</span>
          <span className="text-slate-500">• Toca para cambiar</span>
        </div>
      </div>
    </div>
  );
};
