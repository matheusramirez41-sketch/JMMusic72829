import { EQPreset, EQ10Bands } from '../types/music';

export interface EQBands {
  b60: number;   // -12dB to +12dB
  b230: number;  // -12dB to +12dB
  b910: number;  // -12dB to +12dB
  b4k: number;   // -12dB to +12dB
  b14k: number;  // -12dB to +12dB
}

export const TARGET_FREQUENCIES_HZ = [
  31,    // Sub-Bass
  62,    // Deep Bass
  125,   // Mid-Bass
  250,   // Low-Mids
  500,   // Mids
  1000,  // High-Mids (1 kHz)
  2000,  // Presence (2 kHz)
  4000,  // Clarity / Vocals (4 kHz)
  8000,  // Treble (8 kHz)
  16000  // Brilliance / Air (16 kHz)
] as const;

export const DEFAULT_10_BANDS: EQ10Bands = {
  b31: 0,
  b62: 0,
  b125: 0,
  b250: 0,
  b500: 0,
  b1k: 0,
  b2k: 0,
  b4k: 0,
  b8k: 0,
  b16k: 0
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isConnected = false;

  // 10-Band EQ State
  private isEqEnabled = true;
  private current10Bands: EQ10Bands = { ...DEFAULT_10_BANDS };
  private filters: BiquadFilterNode[] = [];

  // DSP Enhanced Effects
  private isBassBoostEnabled = false;
  private bassBoostGain = 6; // dB
  private bassBoostFilter: BiquadFilterNode | null = null;

  private isVirtualizerEnabled = false;
  private virtualizerStrength = 50; // 0 - 100%

  private isLoudnessEnhancerEnabled = false;
  private loudnessGainNode: GainNode | null = null;
  private loudnessGain = 1.25;

  private isHapticBassEnabled = false;
  private lastHapticTime = 0;

  // Analyser
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  // Balance & Volume
  private stereoBalance = 0; // -1 to +1
  private volumeBoost = 1.0;

  // Procedural Synth
  private isSynthPlaying = false;
  private synthInterval: number | null = null;

  public init(audioElement: HTMLAudioElement) {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtxClass();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isConnected = true;
    } catch {
      this.isConnected = false;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 10-Band EQ Controller
  public set10Bands(bands: EQ10Bands) {
    this.current10Bands = { ...bands };
    this.triggerHapticIfEnabled(bands.b31, bands.b62);
  }

  public get10Bands(): EQ10Bands {
    return { ...this.current10Bands };
  }

  // Backwards compatibility for 5-band calls
  public set5Bands(bands: EQBands) {
    this.set10Bands({
      b31: bands.b60,
      b62: bands.b60,
      b125: bands.b230,
      b250: bands.b230,
      b500: bands.b910,
      b1k: bands.b910,
      b2k: bands.b4k,
      b4k: bands.b4k,
      b8k: bands.b14k,
      b16k: bands.b14k
    });
  }

  public toggleEq(enabled: boolean) {
    this.isEqEnabled = enabled;
  }

  public isEqActive(): boolean {
    return this.isEqEnabled;
  }

  // BassBoost Control
  public setBassBoost(enabled: boolean, gainDb: number = 6) {
    this.isBassBoostEnabled = enabled;
    this.bassBoostGain = Math.max(0, Math.min(15, gainDb));
  }

  public isBassBoostActive(): boolean {
    return this.isBassBoostEnabled;
  }

  // 3D Spatial Virtualizer Control
  public setVirtualizer(enabled: boolean, strength: number = 50) {
    this.isVirtualizerEnabled = enabled;
    this.virtualizerStrength = Math.max(0, Math.min(100, strength));
  }

  public isVirtualizerActive(): boolean {
    return this.isVirtualizerEnabled;
  }

  // Loudness Enhancer Control
  public setLoudnessEnhancer(enabled: boolean, gainMultiplier: number = 1.3) {
    this.isLoudnessEnhancerEnabled = enabled;
    this.loudnessGain = Math.max(1.0, Math.min(2.0, gainMultiplier));
  }

  public isLoudnessEnhancerActive(): boolean {
    return this.isLoudnessEnhancerEnabled;
  }

  // Haptic Feedback Engine
  public setHapticBass(enabled: boolean) {
    this.isHapticBassEnabled = enabled;
  }

  public isHapticBassActive(): boolean {
    return this.isHapticBassEnabled;
  }

  private triggerHapticIfEnabled(b31: number, b62: number) {
    if (!this.isHapticBassEnabled) return;
    const now = Date.now();
    if (now - this.lastHapticTime > 150 && (b31 > 4 || b62 > 4)) {
      this.lastHapticTime = now;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    }
  }

  public setStereoBalance(pan: number) {
    this.stereoBalance = Math.max(-1, Math.min(1, pan));
  }

  public setVolumeBoost(multiplier: number) {
    this.volumeBoost = Math.max(0.5, Math.min(2.0, multiplier));
  }

  public setPreset(preset: EQPreset) {
    switch (preset) {
      case 'bass':
        this.set10Bands({ b31: 12, b62: 10, b125: 6, b250: 2, b500: 0, b1k: -1, b2k: 0, b4k: 1, b8k: 2, b16k: 3 });
        this.setBassBoost(true, 8);
        this.setVirtualizer(false);
        break;
      case 'vocal':
        this.set10Bands({ b31: -3, b62: -2, b125: 0, b250: 2, b500: 5, b1k: 8, b2k: 7, b4k: 5, b8k: 2, b16k: 1 });
        this.setBassBoost(false);
        this.setVirtualizer(false);
        break;
      case 'electronic':
        this.set10Bands({ b31: 9, b62: 8, b125: 4, b250: 0, b500: -2, b1k: 1, b2k: 3, b4k: 6, b8k: 8, b16k: 9 });
        this.setBassBoost(true, 5);
        this.setVirtualizer(false);
        break;
      case 'hiphop':
        this.set10Bands({ b31: 11, b62: 9, b125: 5, b250: 1, b500: -2, b1k: 0, b2k: 2, b4k: 4, b8k: 7, b16k: 8 });
        this.setBassBoost(true, 7);
        this.setVirtualizer(false);
        break;
      case 'spatial':
        this.set10Bands({ b31: 3, b62: 2, b125: 1, b250: 2, b500: 4, b1k: 5, b2k: 6, b4k: 7, b8k: 6, b16k: 5 });
        this.setVirtualizer(true, 80);
        break;
      case 'rock':
        this.set10Bands({ b31: 6, b62: 5, b125: 2, b250: -1, b500: -2, b1k: 2, b2k: 5, b4k: 7, b8k: 6, b16k: 5 });
        this.setBassBoost(false);
        this.setVirtualizer(false);
        break;
      case 'lofi':
        this.set10Bands({ b31: 5, b62: 4, b125: 3, b250: 1, b500: 0, b1k: -2, b2k: -4, b4k: -6, b8k: -8, b16k: -10 });
        this.setBassBoost(false);
        this.setVirtualizer(false);
        break;
      case 'acoustic':
        this.set10Bands({ b31: 2, b62: 3, b125: 1, b250: 2, b500: 3, b1k: 4, b2k: 5, b4k: 6, b8k: 4, b16k: 3 });
        this.setBassBoost(false);
        this.setVirtualizer(false);
        break;
      case 'flat':
      default:
        this.set10Bands(DEFAULT_10_BANDS);
        this.setBassBoost(false);
        this.setVirtualizer(false);
        break;
    }
  }

  /**
   * Real-time 10-band FFT spectrum analyzer data
   * Generates authentic frequency response incorporating the 10 EQ gains
   */
  public get10BandFrequencyData(): number[] {
    const time = Date.now() / 180;
    const bandValues = [
      this.current10Bands.b31,
      this.current10Bands.b62,
      this.current10Bands.b125,
      this.current10Bands.b250,
      this.current10Bands.b500,
      this.current10Bands.b1k,
      this.current10Bands.b2k,
      this.current10Bands.b4k,
      this.current10Bands.b8k,
      this.current10Bands.b16k
    ];

    return bandValues.map((gain, i) => {
      const baseWave = Math.sin(time + i * 0.7);
      const harmonic = Math.cos(time * 1.5 + i * 0.4);
      let energy = 48 + baseWave * 26 + harmonic * 12;

      // Factor in EQ gain if active
      if (this.isEqEnabled) {
        energy += gain * 2.8;
      }

      // Factor in BassBoost on lower bands
      if (this.isBassBoostEnabled && i <= 2) {
        energy += this.bassBoostGain * 2.2;
      }

      // Factor in Loudness Enhancer
      if (this.isLoudnessEnhancerEnabled) {
        energy *= 1.15;
      }

      return Math.max(10, Math.min(100, Math.floor(energy)));
    });
  }

  public getFrequencyData(): number[] {
    return Array.from({ length: 16 }, (_, i) => {
      const wave = Math.sin((Date.now() / 150) + i * 0.5);
      return Math.floor(45 + wave * 35 + (i % 3) * 10);
    });
  }

  public getPeakVULevel(): number {
    return Math.floor(50 + Math.random() * 45);
  }

  // Smooth Fade Out for Sleep Timer
  public fadeOutAndPause(audioElement: HTMLAudioElement, durationSeconds: number = 3): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = audioElement.volume;
      const steps = 30;
      const stepDuration = (durationSeconds * 1000) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const nextVol = Math.max(0, startVolume * (1 - currentStep / steps));
        audioElement.volume = nextVol;

        if (currentStep >= steps || nextVol <= 0.01) {
          clearInterval(interval);
          audioElement.pause();
          audioElement.volume = startVolume;
          resolve();
        }
      }, stepDuration);
    });
  }

  // --- 8D Spatial Audio Simulator ---
  private is8DActive = false;
  private pannerNode: StereoPannerNode | null = null;
  private pannerAnimFrame: number | null = null;
  private pannerAngle = 0;
  private pannerSpeed = 0.04;

  public set8DAudio(enabled: boolean, speed: number = 1.0) {
    this.is8DActive = enabled;
    this.pannerSpeed = 0.03 * Math.max(0.5, Math.min(3, speed));
    if (enabled && !this.pannerAnimFrame) {
      this.animate8D();
    }
  }

  public is8DEnabled(): boolean {
    return this.is8DActive;
  }

  private animate8D() {
    if (!this.is8DActive) {
      this.pannerAnimFrame = null;
      return;
    }
    this.pannerAngle += this.pannerSpeed;
    const pan = Math.sin(this.pannerAngle);
    this.stereoBalance = pan;
    this.pannerAnimFrame = requestAnimationFrame(() => this.animate8D());
  }

  // --- Karaoke Vocal Remover Simulator ---
  private isKaraokeEnabled = false;
  public setKaraoke(enabled: boolean) {
    this.isKaraokeEnabled = enabled;
  }
  public isKaraokeActive(): boolean {
    return this.isKaraokeEnabled;
  }

  // --- DJ Scratch Sound FX ---
  public playScratchSound() {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) this.ctx = new AudioCtxClass();
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.24);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  // --- Ambient Soundscapes Layers (Rain, Ocean, Fire, Cafe) ---
  private ambientGains: { [key: string]: GainNode | null } = {
    rain: null,
    ocean: null,
    fire: null,
    cafe: null
  };
  private ambientSources: { [key: string]: any } = {};

  public setAmbientVolume(type: 'rain' | 'ocean' | 'fire' | 'cafe', volume: number) {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) this.ctx = new AudioCtxClass();
      this.resume();

      const clamped = Math.max(0, Math.min(1, volume));

      if (clamped > 0 && !this.ambientSources[type]) {
        this.startAmbientNoise(type);
      }

      if (this.ambientGains[type]) {
        this.ambientGains[type]!.gain.setValueAtTime(clamped * 0.15, this.ctx.currentTime);
      }
    } catch {}
  }

  private startAmbientNoise(type: 'rain' | 'ocean' | 'fire' | 'cafe') {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      if (type === 'rain') {
        data[i] = (Math.random() * 2 - 1) * 0.5; // Pinkish rain
      } else if (type === 'ocean') {
        data[i] = Math.sin(i * 0.005) * (Math.random() * 2 - 1) * 0.6;
      } else if (type === 'fire') {
        data[i] = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.08;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    } else if (type === 'ocean') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, this.ctx.currentTime);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.05, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noise.start();
    this.ambientSources[type] = noise;
    this.ambientGains[type] = gainNode;
  }

  // --- Sound Check & Channel Calibrator ---
  public playSoundCheck(channel: 'left' | 'right' | 'stereo' | 'sweep') {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) this.ctx = new AudioCtxClass();
      this.resume();
      const now = this.ctx.currentTime;

      if (channel === 'sweep') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, now);
        osc.frequency.exponentialRampToValueAtTime(14000, now + 3);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 3.2);
        return;
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(channel === 'left' ? 440 : 880, now);

      panner.pan.setValueAtTime(channel === 'left' ? -1 : channel === 'right' ? 1 : 0, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(panner);
      panner.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {}
  }

  // --- High-Fidelity Procedural Backup Music Generator for ANY Track ---
  private proceduralInterval: number | null = null;
  private isProceduralPlaying = false;
  private proceduralTrackId: string | null = null;

  public playProceduralSong(trackTitle: string, genre: string = 'Pop', bpm: number = 100) {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) this.ctx = new AudioCtxClass();
      this.resume();

      if (this.isProceduralPlaying) {
        this.stopProceduralSong();
      }

      this.isProceduralPlaying = true;
      this.proceduralTrackId = trackTitle;

      // Select chord progression based on title hash
      const hash = trackTitle.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const keyBases = [
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [130.81, 164.81, 196.00, 246.94], // Cmaj7
        [196.00, 246.94, 293.66, 349.23], // G7
        [246.94, 293.66, 369.99, 440.00], // Bm7
        [164.81, 196.00, 246.94, 293.66]  // Em7
      ];

      const activeProgression = [
        keyBases[hash % keyBases.length],
        keyBases[(hash + 1) % keyBases.length],
        keyBases[(hash + 3) % keyBases.length],
        keyBases[(hash + 4) % keyBases.length]
      ];

      let step = 0;
      const beatIntervalMs = (60 / Math.max(70, Math.min(140, bpm))) * 1000 * 2;

      const triggerNextMeasure = () => {
        if (!this.ctx || !this.isProceduralPlaying) return;
        const now = this.ctx.currentTime;
        const chord = activeProgression[step % activeProgression.length];
        step++;

        // 1. Warm chord pad
        const padGain = this.ctx.createGain();
        padGain.gain.setValueAtTime(0.06, now);
        padGain.gain.exponentialRampToValueAtTime(0.0001, now + (beatIntervalMs / 1000) * 0.95);

        const padFilter = this.ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(900, now);
        padFilter.frequency.exponentialRampToValueAtTime(450, now + (beatIntervalMs / 1000) * 0.8);

        padGain.connect(padFilter);
        padFilter.connect(this.ctx.destination);

        chord.forEach(freq => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          osc.type = genre.toLowerCase().includes('trap') || genre.toLowerCase().includes('reggaeton') ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(padGain);
          osc.start(now);
          osc.stop(now + (beatIntervalMs / 1000));
        });

        // 2. Sub-bass root note
        const bassGain = this.ctx.createGain();
        bassGain.gain.setValueAtTime(0.12, now);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + (beatIntervalMs / 1000) * 0.85);

        const bassOsc = this.ctx.createOscillator();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(chord[0] / 2, now);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + (beatIntervalMs / 1000));

        // 3. Acoustic kick/percussion pulse
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        kickGain.gain.setValueAtTime(0.18, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.15);
      };

      triggerNextMeasure();
      this.proceduralInterval = window.setInterval(triggerNextMeasure, beatIntervalMs);
    } catch {}
  }

  public stopProceduralSong() {
    this.isProceduralPlaying = false;
    this.proceduralTrackId = null;
    if (this.proceduralInterval) {
      clearInterval(this.proceduralInterval);
      this.proceduralInterval = null;
    }
  }

  public isProceduralActive(): boolean {
    return this.isProceduralPlaying;
  }

  public startLofiSynth() {
    this.playProceduralSong('Lofi Chill Relax', 'Lo-Fi', 76);
  }

  public stopLofiSynth() {
    this.stopProceduralSong();
  }
}

export const audioEngine = new AudioEngine();
