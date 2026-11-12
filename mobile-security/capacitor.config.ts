import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.stoa.academie',
  appName: 'STOA Académie',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
