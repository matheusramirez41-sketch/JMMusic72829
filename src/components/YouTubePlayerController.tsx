import React, { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

interface YouTubePlayerControllerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  showVideo?: boolean;
  isExpanded?: boolean;
  onToggleVideo?: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onStateChange: (isPlaying: boolean) => void;
  seekTime: number | null;
  onSeekHandled: () => void;
  onErrorFallback?: () => void;
}

export const YouTubePlayerController: React.FC<YouTubePlayerControllerProps> = ({
  videoId,
  isPlaying,
  volume,
  showVideo = false,
  isExpanded = false,
  onToggleVideo,
  onTimeUpdate,
  onEnded,
  onStateChange,
  seekTime,
  onSeekHandled,
  onErrorFallback
}) => {
  const playerRef = useRef<any>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const progressIntervalRef = useRef<any>(null);

  // Stable refs for all callbacks to prevent effect re-triggers
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  const onErrorFallbackRef = useRef(onErrorFallback);
  onErrorFallbackRef.current = onErrorFallback;

  // Track if current video successfully reached playing state
  const hasStartedPlayingRef = useRef(false);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevOnReady === 'function') prevOnReady();
      setIsApiReady(true);
    };

    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        clearInterval(checkInterval);
      }
    }, 150);

    return () => clearInterval(checkInterval);
  }, []);

  // Cleanup helper
  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch {}
      playerRef.current = null;
    }
  }, []);

  // Create or switch video ONLY when videoId or isApiReady changes
  useEffect(() => {
    if (!isApiReady || !videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;

    hasStartedPlayingRef.current = false;

    // Fast path: reuse existing active player without destroying DOM
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        playerRef.current.loadVideoById(videoId, 0);
        if (typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute();
        }
        playerRef.current.setVolume(Math.round(volumeRef.current * 100));
        if (isPlayingRef.current) {
          playerRef.current.playVideo();
        }
        return;
      } catch (err) {
        console.warn('Fast video load failed, re-creating player:', err);
      }
    }

    // Full initialization path
    destroyPlayer();
    if (!hostRef.current) return;

    hostRef.current.replaceChildren();
    const mountNode = document.createElement('div');
    hostRef.current.appendChild(mountNode);

    try {
      playerRef.current = new window.YT.Player(mountNode, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: isPlayingRef.current ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          fs: 1
        },
        events: {
          onReady: (event: any) => {
            try {
              if (typeof event.target.unMute === 'function') {
                event.target.unMute();
              }
              event.target.setVolume(Math.round(volumeRef.current * 100));
              if (isPlayingRef.current) {
                event.target.playVideo();
              }
            } catch (err) {
              console.warn('onReady setup error:', err);
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3, CUED = 5
            if (event.data === 1) {
              hasStartedPlayingRef.current = true;
              onStateChangeRef.current(true);
            } else if (event.data === 5 && isPlayingRef.current) {
              try {
                event.target.unMute?.();
                event.target.playVideo?.();
              } catch {}
            } else if (event.data === 2) {
              // Only report pause if user actively intended to pause
              if (!isPlayingRef.current) {
                onStateChangeRef.current(false);
              }
            } else if (event.data === 0) {
              onEndedRef.current();
            }
          },
          onError: (event: any) => {
            console.warn('YouTube Player error code:', event.data);
            if (onErrorFallbackRef.current) {
              onErrorFallbackRef.current();
            }
          }
        }
      });
    } catch (err) {
      console.error('Error instantiating YouTube player:', err);
      if (onErrorFallbackRef.current) onErrorFallbackRef.current();
    }
  }, [isApiReady, videoId, destroyPlayer]);

  // Sync play/pause commands from app UI
  useEffect(() => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        if (typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute();
        }
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } else {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      }
    } catch (err) {
      console.warn('Error in sync play/pause:', err);
    }
  }, [isPlaying]);

  // Sync volume changes
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
    try {
      playerRef.current.setVolume(Math.round(volume * 100));
    } catch {}
  }, [volume]);

  // Handle seek requests
  useEffect(() => {
    if (seekTime !== null && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(seekTime, true);
        if (isPlayingRef.current && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
        onSeekHandled();
      } catch {}
    }
  }, [seekTime, onSeekHandled]);

  // High-frequency 40ms polling for instant, zero-lag synchronized lyrics switching
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const current = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          if (dur > 0) {
            onTimeUpdateRef.current(current, dur);
          }
        } catch {}
      }
    }, 40);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [videoId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyPlayer();
    };
  }, [destroyPlayer]);

  // Dynamically position the SINGLE master YouTube player:
  // 1. When in NowPlayingView and user wants video: placed right in the video card slot (z-40)
  // 2. When browsing library/playlists and user enabled video: Picture-in-Picture in bottom right corner (z-40)
  // 3. When in audio mode: kept alive with standard dimensions behind background (ZERO duplicate audio, never suspended)
  const [slotStyle, setSlotStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!showVideo || !isExpanded) {
      setSlotStyle(null);
      return;
    }

    const updatePosition = () => {
      const slot = document.getElementById('now-playing-video-slot');
      if (slot) {
        const rect = slot.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSlotStyle({
            position: 'fixed',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            zIndex: 50,
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            pointerEvents: 'auto',
            opacity: 1
          });
          return;
        }
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showVideo, isExpanded]);

  // Single permanent container that NEVER unmounts from the DOM
  let containerStyle: React.CSSProperties;
  let containerClass: string;

  if (showVideo && isExpanded) {
    containerStyle = slotStyle || {
      position: 'fixed',
      top: '112px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92vw',
      maxWidth: '448px',
      aspectRatio: '16/9',
      zIndex: 50,
      borderRadius: '1rem',
      overflow: 'hidden',
      backgroundColor: '#000',
      opacity: 1,
      pointerEvents: 'auto'
    };
    containerClass = 'fixed z-50 transition-all duration-200';
  } else if (showVideo && !isExpanded) {
    containerStyle = {
      position: 'fixed',
      bottom: '96px',
      right: '16px',
      width: '320px',
      height: '180px',
      zIndex: 50,
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      backgroundColor: '#000',
      opacity: 1,
      pointerEvents: 'auto'
    };
    containerClass = 'fixed z-50 transition-all duration-300 border border-indigo-500/40 group';
  } else {
    // Audio-only mode: Single master player kept alive with non-zero dimensions
    // placed behind the application background so Chrome and YouTube never suspend audio
    containerStyle = {
      position: 'fixed',
      bottom: '0px',
      right: '0px',
      width: '240px',
      height: '180px',
      zIndex: -50,
      opacity: 0.001,
      pointerEvents: 'none'
    };
    containerClass = 'fixed -z-50 pointer-events-none';
  }

  return (
    <div style={containerStyle} className={containerClass}>
      {showVideo && !isExpanded && onToggleVideo && (
        <div className="absolute top-2 right-2 z-50 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleVideo}
            className="px-2 py-0.5 bg-black/80 hover:bg-black text-white text-[10px] font-bold rounded-lg border border-white/20 shadow backdrop-blur-sm cursor-pointer"
            title="Ocultar video flotante"
          >
            Ocultar
          </button>
        </div>
      )}
      <div ref={hostRef} id="jmmusic-bg-player" className="w-full h-full" />
    </div>
  );
};

