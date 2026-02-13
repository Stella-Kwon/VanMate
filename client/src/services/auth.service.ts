import { Platform, Alert } from 'react-native';
import { API_BASE_URL } from '../utils/api';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import { saveTokens, clearTokens, saveCodeVerifier, getCodeVerifier, clearCodeVerifier } from '../utils/tokenStorage';

export interface LoginResponse {
    accessToken: string;
    user: {
        userId: string;
        email: string;
        name: string;
    };
    csrfToken?: string;
}

export interface RegisterData {
    email: string;
    password: string;
    given_name: string;
    family_name: string;
}

// 이메일 로그인
export const emailLogin = async (email: string, password: string): Promise<LoginResponse> => {
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // 토큰 저장
    saveTokens(data.accessToken, data.csrfToken);
    
    return data;
};

// 회원가입
export const register = async (data: RegisterData): Promise<void> => {
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        throw new Error('Please enter a valid email address');
    }

    // 비밀번호 규칙 검사
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(data.password)) {
        throw new Error(
            'Password must be at least 6 characters and contain:\n- One uppercase letter\n- One lowercase letter\n- One number\n- One special character'
        );
    }

    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
            const text = await response.text();
            if (text) {
                try {
                    const error = JSON.parse(text);
                    errorMessage = error.message || errorMessage;
                } catch {
                    errorMessage = text || errorMessage;
                }
            } else {
                errorMessage = `${response.status}: ${response.statusText}`;
            }
        } catch {
            errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
};

// Google OAuth (웹용 - PKCE)
export const googleLoginWeb = async (): Promise<void> => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
    
    if (!clientId) {
        throw new Error('Google Web Client ID not configured');
    }
    
    const redirectUri = window.location.origin;
    
    // PKCE용 codeVerifier 생성
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // sessionStorage에 저장
    saveCodeVerifier(codeVerifier);
    
    // Google OAuth URL 생성
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    // 전체 페이지 redirect
    window.location.href = authUrl;
};

// Google OAuth Callback 처리 (웹)
export const handleGoogleCallback = async (code: string): Promise<LoginResponse> => {
    const codeVerifier = getCodeVerifier();
    const redirectUri = Platform.OS === 'web' 
        ? window.location.origin 
        : 'http://localhost/8082';
    
    const response = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            code,
            codeVerifier: codeVerifier || undefined,
            redirectUri,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // 토큰 저장
    saveTokens(data.accessToken, data.csrfToken);
    
    // codeVerifier 정리
    clearCodeVerifier();
    
    return data;
};

// Google OAuth (모바일용 - ID Token)
export const googleLoginMobile = async (): Promise<LoginResponse> => {
    const clientId = Platform.select({
        ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    });
    
    if (!clientId) {
        throw new Error(`Google Client ID not configured for ${Platform.OS}`);
    }
    
    // 동적으로 GoogleSignin import
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    
    // Google Sign-In 설정
    GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB, // 백엔드 검증용
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        offlineAccess: false,
        scopes: ['profile', 'email'],
    });
    
    // Google 로그인 시작
    if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
    }
    const userInfo = await GoogleSignin.signIn();
    
    // ID Token을 백엔드로 전송
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken;
    
    if (!idToken) {
        throw new Error('No ID token received from Google');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            idToken: idToken,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // 모바일은 메모리에만 저장 (토큰 저장 함수는 웹용이므로 호출 안 함)
    
    return data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
    // 먼저 토큰 삭제 (refresh 호출 방지)
    clearTokens();
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    
    if (!response.ok) {
        throw new Error('Logout failed');
    }
};

// 토큰 갱신
export const refreshToken = async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Refresh failed');
    }

    const data = await response.json();
    
    // 토큰 저장
    saveTokens(data.accessToken);
    
    return data.accessToken;
};

