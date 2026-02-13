import * as Crypto from 'expo-crypto';

const base64URLEncode = (input: string | ArrayBuffer): string => {
    let base64: string;
    if (typeof input === 'string') {
        base64 = btoa(input);
    } else {
        const bytes = new Uint8Array(input);
        let binary = '';
        bytes.forEach((b) => binary += String.fromCharCode(b));
        base64 = btoa(binary);
    }
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

export const generateCodeVerifier = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return base64URLEncode(randomBytes.buffer as ArrayBuffer);
};

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return base64URLEncode(hashBuffer);
};

