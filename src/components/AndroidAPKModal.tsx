import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ShieldCheck,
  HardDrive,
  WifiOff,
  Terminal,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidAPKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAPKModal: React.FC<AndroidAPKModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'webview' | 'capacitor'>('install');
  const [webViewStatus, setWebViewStatus] = useState({
    audioContext: false,
    storage: false,
    offlineCache: false,
    isStandalone: false
  });

  useEffect(() => {
    // Run diagnostics for WebView environment
    const hasAudio = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
    let hasStorage = false;
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      hasStorage = true;
    } catch {}
    const hasCache = typeof window !== 'undefined' && 'caches' in window;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    setWebViewStatus({
      audioContext: hasAudio,
      storage: hasStorage,
      offlineCache: hasCache,
      isStandalone
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                App para Android & APK
              </h2>
              <p className="text-xs text-slate-400">
                Instalación directa, compatibilidad WebView y compilación APK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'install'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Instalar App
          </button>
          <button
            onClick={() => setActiveTab('webview')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'webview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Modo WebView
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'capacitor'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Compilar APK
          </button>
        </div>

        {/* TAB 1: Direct Install */}
        {activeTab === 'install' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Instalación Directa como App / APK (WebAPK)</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                JMMUSIC está configurada como una Progressive Web App (PWA) de nivel producción. Al instalarla en Android, el sistema genera automáticamente un paquete APK nativo en tu dispositivo con icono, arranque a pantalla completa y almacenamiento offline.
              </p>

              {isInstalled ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>¡JMMUSIC ya está instalada en tu dispositivo!</span>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={install}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar JMMUSIC en Android</span>
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="font-semibold text-white">Cómo instalar desde cualquier navegador:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Abre el menú de tu navegador (los tres puntos <strong className="text-white">⋮</strong> arriba a la derecha).</li>
                    <li>Selecciona <strong className="text-indigo-400">"Instalar aplicación"</strong> o <strong className="text-indigo-400">"Agregar a la pantalla principal"</strong>.</li>
                    <li>¡Listo! Se creará el acceso directo con icono oficial y funcionamiento sin internet.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WebView Diagnostics */}
        {activeTab === 'webview' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Estado y Compatibilidad con Android WebView</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                JMMUSIC cuenta con protecciones para wrappers de APKPure, Uptodown, Web2APK y WebView nativo, garantizando que nunca se produzca una pantalla en blanco.
              </p>

              <div className="space-y-2 pt-1 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Web Audio API / Motor de Sonido:</span>
                  <span className={webViewStatus.audioContext ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {webViewStatus.audioContext ? '✓ ACTIVO Y COMPATIBLE' : 'Simulación Activa'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Almacenamiento Local (LocalStorage):</span>
                  <span className={webViewStatus.storage ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {webViewStatus.storage ? '✓ PERSISTENCIA ACTIVA' : 'Memoria Fallback'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Caché Offline / Service Worker:</span>
                  <span className={webViewStatus.offlineCache ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {webViewStatus.offlineCache ? '✓ LISTO PARA SIN INTERNET' : 'Básico'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Modo de visualización:</span>
                  <span className="text-indigo-400 font-bold">
                    {webViewStatus.isStandalone ? 'PWA STANDALONE / APK' : 'NAVEGADOR / WEBVIEW'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Capacitor Native APK Build */}
        {activeTab === 'capacitor' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Terminal className="w-4 h-4" />
                <span>Compilación a APK Nativo (.apk)</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                El proyecto incluye <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">capacitor.config.ts</code> con esquema HTTPS seguro para compilar a archivo <strong className="text-white">.apk</strong> instalable en cualquier teléfono Android o publicar en APKPure y Uptodown:
              </p>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                <div className="text-slate-500"># 1. Instalar dependencias nativas</div>
                <div className="text-emerald-400 font-bold">npm run build</div>
                <div className="text-slate-500 pt-1"># 2. Sincronizar proyecto Android</div>
                <div className="text-emerald-400 font-bold">npx cap sync android</div>
                <div className="text-slate-500 pt-1"># 3. Compilar APK con Android Studio / CLI</div>
                <div className="text-emerald-400 font-bold">npx cap open android</div>
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
