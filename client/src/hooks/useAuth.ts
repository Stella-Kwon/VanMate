import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '../utils/api';
import { getTokens, saveTokens, clearTokens } from '../utils/tokenStorage';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
}

export const useAuth = (): AuthState & { checkAuth: () => Promise<void> } => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        const { accessToken } = getTokens();
        if (accessToken) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                saveTokens(data.accessToken, data.csrfToken);
                setIsAuthenticated(true);
            } else {
                if (Platform.OS === 'web') {
                    clearTokens();
                }
                setIsAuthenticated(false);
            }
        } catch {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return { isAuthenticated, isLoading, checkAuth };
};

export const useAuthRedirect = (redirectTo: string = '/home') => {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
    if (!isLoading && isAuthenticated) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState(null, '', redirectTo);
        }
        router.replace(redirectTo as any);
    }
    }, [isAuthenticated, isLoading, redirectTo]);
};

