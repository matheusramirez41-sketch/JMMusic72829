import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Mic,
  X,
  Gauge,
  RotateCcw,
  RotateCw,
  Moon,
  Trash2,
  History,
  Sparkles,
  Music2,
  User,
  Disc3,
  ListMusic
} from 'lucide-react';

export type SearchFilterType = 'all' | 'songs' | 'artists' | 'albums';

interface SearchBarProps {
  onSearch: (query: string, filter: SearchFilterType) => void;
  onClear: () => void;
  onOpenSleepTimer: () => void;
  onSeekRelative: (seconds: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (spd: number) => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({
  onSearch,
  onClear,
  onOpenSleepTimer,
  onSeekRelative,
  playbackSpeed,
  onChangeSpeed,
  isSearching
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filterType, setFilterType] = useState<SearchFilterType>('all');
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Bad Bunny',
    'Feid',
    'Travis Scott',
    'Rauw Alejandro',
    'Coldplay'
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Trigger search with debounce
  const triggerDebouncedSearch = useCallback((query: string, filter: SearchFilterType) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      onClear();
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearch(query.trim(), filter);

      // Save to recent searches
      const term = query.trim();
      setRecentSearches(prev => [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 7));
    }, 350);
  }, [onSearch, onClear]);

  // Execute immediate search on Enter or chip click
  const triggerImmediateSearch = (query: string, filter: SearchFilterType) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!query.trim()) {
      onClear();
      return;
    }
    onSearch(query.trim(), filter);
    const term = query.trim();
    setRecentSearches(prev => [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 7));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    triggerDebouncedSearch(val, filterType);
  };

  const handleFilterChange = (newFilter: SearchFilterType) => {
    setFilterType(newFilter);
    if (inputValue.trim()) {
      triggerImmediateSearch(inputValue, newFilter);
    }
  };

  const handleSelectRecentTerm = (term: string) => {
    setInputValue(term);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    triggerImmediateSearch(term, filterType);
  };

  const handleClear = () => {
    setInputValue('');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    onClear();
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        triggerImmediateSearch(transcript, filterType);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const filterTabs: { id: SearchFilterType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'Todo', icon: Sparkles },
    { id: 'songs', label: 'Canciones', icon: Music2 },
    { id: 'artists', label: 'Artistas', icon: User },
    { id: 'albums', label: 'Álbumes', icon: Disc3 },
  ];

  return (
    <div className="bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-2xl backdrop-blur-md">
      {/* Search Input Row */}
      <div className="flex items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            triggerImmediateSearch(inputValue, filterType);
          }}
          className="relative flex-1"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Buscar canción, artista o álbum (ej. Bad Bunny, Coldplay, Shakira, Queen...)"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner tracking-normal"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-0.5"
              title="Borrar texto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Voice Search Button */}
        <button
          type="button"
          onClick={startVoiceSearch}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
          title="Búsqueda por voz"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Sleep Timer */}
        <button
          type="button"
          onClick={onOpenSleepTimer}
          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-slate-700 transition-colors cursor-pointer"
          title="Temporizador de apagado"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* Seek Controls & Speed Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onSeekRelative(-10)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            title="Retroceder 10 segundos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSeekRelative(10)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            title="Adelantar 10 segundos"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 text-[11px] font-mono border-l border-slate-800 pl-1.5 ml-0.5">
            <Gauge className="w-3 h-3 text-indigo-400" />
            <select
              value={playbackSpeed}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
            >
              <option value="0.75" className="bg-slate-900">0.75x</option>
              <option value="1" className="bg-slate-900">1.0x</option>
              <option value="1.25" className="bg-slate-900">1.25x</option>
              <option value="1.5" className="bg-slate-900">1.5x</option>
              <option value="2" className="bg-slate-900">2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs (Todo, Canciones, Artistas, Álbumes) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recent Search History */}
      {recentSearches.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <History className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-slate-500 mr-1 flex-shrink-0">Historial:</span>
            {recentSearches.map((term, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectRecentTerm(term)}
                className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 cursor-pointer whitespace-nowrap transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer flex-shrink-0 ml-2 transition-colors"
            title="Borrar historial de búsquedas"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      )}
    </div>
  );
});
