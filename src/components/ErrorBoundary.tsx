import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Music2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('JMMUSIC Uncaught Error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear potentially corrupted session state
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-6 shadow-xl">
            <Music2 className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Recuperación Automática</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              JMMUSIC Reproductor
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Ocurrió un ajuste de inicialización en el navegador. Pulsa el botón para recargar la aplicación en modo seguro.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-500 overflow-x-auto text-left max-h-24">
                {this.state.error.message || 'Error de arranque'}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recargar JMMUSIC</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
