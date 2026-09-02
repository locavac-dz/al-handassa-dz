import { ExpoConfig, ConfigContext } from '@expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.alhandassa.dev';
  }

  if (IS_PREVIEW) {
    return 'com.alhandassa.preview';
  }

  return 'com.alhandassa.dz';
};

const getName = () => {
  if (IS_DEV) {
    return 'Al Handassa (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Al Handassa (Preview)';
  }

  return 'Al Handassa';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getName(),
  slug: 'al-handassa-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1B3A6B',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTabletMode: true,
    bundleIdentifier: getUniqueIdentifier(),
    buildNumber: '1',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1B3A6B',
    },
    package: getUniqueIdentifier(),
    versionCode: 1,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        sounds: ['default'],
        defaultChannel: 'default',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Al Handassa to access your face data.',
      },
    ],
  ],
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: 'al-handassa-dz',
    },
  },
  owner: 'alhandassa',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/al-handassa-dz',
    fallbackToCacheTimeout: 1000,
    checkAutomatically: 'ON_LOAD',
  },
});
