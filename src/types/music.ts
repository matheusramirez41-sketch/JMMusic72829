export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  audioUrl: string;
  coverUrl: string;
  accentColor: string;
  genre: string;
  plays: number;
  lyrics?: { time: number; text: string }[];
}

export interface EQ10Bands {
  b31: number;   // 31 Hz (-15 to +15 dB)
  b62: number;   // 62 Hz (-15 to +15 dB)
  b125: number;  // 125 Hz (-15 to +15 dB)
  b250: number;  // 250 Hz (-15 to +15 dB)
  b500: number;  // 500 Hz (-15 to +15 dB)
  b1k: number;   // 1 kHz (-15 to +15 dB)
  b2k: number;   // 2 kHz (-15 to +15 dB)
  b4k: number;   // 4 kHz (-15 to +15 dB)
  b8k: number;   // 8 kHz (-15 to +15 dB)
  b16k: number;  // 16 kHz (-15 to +15 dB)
}

export type EQPreset = 'flat' | 'bass' | 'vocal' | 'lofi' | 'spatial' | 'rock' | 'electronic' | 'hiphop' | 'acoustic' | 'custom';

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
}
