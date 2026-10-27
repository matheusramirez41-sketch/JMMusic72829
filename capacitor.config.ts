import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jmmusic.player',
  appName: 'JMMUSIC',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
