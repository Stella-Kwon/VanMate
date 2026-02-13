import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { emailLogin } from '../services/auth.service';
import { validateEmail } from '../utils/validation';
import { isNetworkError } from '../utils/errors';
import { showAlert } from '../utils/alert';
import { Platform } from 'react-native';

interface LoginError {
    message: string;
    requiresGoogle?: boolean;
    isEmailWrong?: boolean;
    isPasswordWrong?: boolean;
}

const parseLoginError = (errorMessage: string): LoginError => {
    if (errorMessage.includes('Google login') || errorMessage.includes('created with Google')) {
        return { message: errorMessage, requiresGoogle: true };
    }
    if (errorMessage.includes('Given email is wrong') || errorMessage.toLowerCase().includes('email is wrong')) {
        return { message: 'The email address you entered is incorrect. Please check and try again.', isEmailWrong: true };
    }
    if (errorMessage.includes('password') && errorMessage.includes('incorrect')) {
        return { message: errorMessage, isPasswordWrong: true };
    }
    return { message: errorMessage };
};

export const useEmailLogin = () => {
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (email: string, password: string, onGoogleRequired?: () => void) => {
        if (!email || !password) {
            showAlert('Error', 'Please enter email and password');
            return;
        }

        if (!validateEmail(email)) {
            showAlert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            const data = await emailLogin(email, password);
            
            Alert.alert('Success', 'Logged in successfully!');
            setTimeout(() => router.replace('/home'), 100);
        } catch (error: any) {
            const errorMessage = error.message || 'Login failed';
            const parsedError = parseLoginError(errorMessage);
            
            if (parsedError.requiresGoogle && onGoogleRequired) {
                if (Platform.OS === 'web') {
                    const useGoogle = window.confirm('This account was created with Google login. Please use Google login to sign in.\n\nClick OK to use Google Login.');
                    if (useGoogle) {
                        onGoogleRequired();
                    }
                } else {
                    Alert.alert(
                        'Google Login Required',
                        'This account was created with Google login. Please use Google login to sign in.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Use Google Login', onPress: onGoogleRequired },
                        ]
                    );
                }
                return;
            }

            if (isNetworkError(error)) {
                showAlert('Network Error', 'Cannot connect to server. Please check your connection.');
            } else {
                showAlert('Login Failed', parsedError.message || 'Invalid credentials. Please check and try again.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return { login, loading };
};

