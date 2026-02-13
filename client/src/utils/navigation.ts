import { Platform } from 'react-native';
import { router } from 'expo-router';

export const navigateTo = (path: string): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState(null, '', path);
  }
  router.replace(path as any);
};


