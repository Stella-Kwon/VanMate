import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getApiBaseUrl = (): string => {
    if (!__DEV__) {
        return 'https://high5_Junction2025.com';
    }
    if (Platform.OS === 'web') {
        return 'http://localhost:3000';
    }
    // mobile: macbook ip
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
    return `http://${debuggerHost}:3000`;
};

export const API_BASE_URL = getApiBaseUrl();

