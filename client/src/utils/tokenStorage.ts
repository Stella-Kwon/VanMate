import { Platform } from 'react-native';

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    CSRF_TOKEN: 'csrfToken',
    CODE_VERIFIER: 'google_code_verifier',
} as const;

const isStorageAvailable = (): boolean => {
    return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.sessionStorage;
};

const getStorage = (): Storage | null => {
    return isStorageAvailable() ? window.sessionStorage : null;
};

const setItem = (key: string, value: string): void => {
    const storage = getStorage();
    if (!storage) {
        if (Platform.OS !== 'web') {
            return;
        }
        throw new Error('SessionStorage is not available');
    }
    storage.setItem(key, value);
    if (storage.getItem(key) !== value) {
        throw new Error(`Failed to save ${key}`);
    }
};

const getItem = (key: string): string | null => {
    const storage = getStorage();
    return storage?.getItem(key) ?? null;
};

const removeItem = (key: string): void => {
    getStorage()?.removeItem(key);
};

export const saveTokens = (accessToken: string, csrfToken?: string): void => {
    setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    
    if (csrfToken) {
        setItem(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
    }
};

export const getTokens = (): { accessToken: string | null; csrfToken: string | null } => {
    return {
        accessToken: getItem(STORAGE_KEYS.ACCESS_TOKEN),
        csrfToken: getItem(STORAGE_KEYS.CSRF_TOKEN),
    };
};

export const clearTokens = (): void => {
    removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeItem(STORAGE_KEYS.CSRF_TOKEN);
};

export const saveCodeVerifier = (codeVerifier: string): void => {
    setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
};

export const getCodeVerifier = (): string | null => {
    return getItem(STORAGE_KEYS.CODE_VERIFIER);
};

export const clearCodeVerifier = (): void => {
    removeItem(STORAGE_KEYS.CODE_VERIFIER);
};

