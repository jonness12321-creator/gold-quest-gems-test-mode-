import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rahulrajput.coinquest',
  appName: 'CoinQuest',
  webDir: 'dist',
  server: {
    url: 'https://gold-quest-gems-test-mode.rahulrajputss123.workers.dev',
    cleartext: true
  }
};

export default config;
