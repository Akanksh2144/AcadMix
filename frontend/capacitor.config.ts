import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acadmix.app',
  appName: 'AcadMix',
  webDir: 'build',
  server: {
    cleartext: true,
    androidScheme: 'http',
  }
};

export default config;
