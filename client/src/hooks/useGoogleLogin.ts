import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { googleLoginWeb, googleLoginMobile, handleGoogleCallback } from '../services/auth.service';
import { saveTokens } from '../utils/tokenStorage';
import { showAlert } from '../utils/alert';

export const useGoogleLogin = () => {
    const [loading, setLoading] = useState(false);

    const login = useCallback(async () => {
        try {
            setLoading(true);
            if (Platform.OS === 'web') {
                await googleLoginWeb();
            } else {
                const data = await googleLoginMobile();
                saveTokens(data.accessToken, data.csrfToken);
                Alert.alert('Success', 'Logged in successfully!');
                setTimeout(() => router.replace('/home'), 100);
            }
        } catch (error: any) {
            if (error.code === 'SIGN_IN_CANCELLED') {
                Alert.alert('Cancelled', 'Google login was cancelled');
                return;
            }
            showAlert('Error', error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    }, []);

    return { login, loading };
};

export const useGoogleCallback = () => {
    const [loading, setLoading] = useState(false);

    const handleCallback = useCallback(async (code: string) => {
        try {
            setLoading(true);
            const data = await handleGoogleCallback(code);
            saveTokens(data.accessToken, data.csrfToken);

            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.history.replaceState({}, '', window.location.pathname);
            }

            Alert.alert('Success', 'Logged in successfully!');
            setTimeout(() => router.replace('/home'), 100);
        } catch (error: any) {
            showAlert('Error', error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    }, []);

    return { handleCallback, loading };
};

