import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import authStyles from "../src/styles/AuthStyles";
import { useEmailLogin } from "../src/hooks/useEmailLogin";
import { useGoogleLogin, useGoogleCallback } from "../src/hooks/useGoogleLogin";
import { Platform } from "react-native";

const BUTTON_STYLES = {
    primary: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    google: { backgroundColor: '#4285F4', padding: 15, borderRadius: 8, alignItems: 'center' },
    disabled: { backgroundColor: '#ccc' },
} as const;

export default function Index() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const { login: emailLogin, loading: emailLoading } = useEmailLogin();
    const { login: googleLogin, loading: googleLoading } = useGoogleLogin();
    const { handleCallback, loading: callbackLoading } = useGoogleCallback();

    useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
            Alert.alert('Error', `Google login failed: ${error}`);
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }
        
        if (code) {
            handleCallback(code);
        }
    }
    }, [handleCallback]);

    const handleEmailLogin = () => {
        emailLogin(email, password, () => googleLogin());
    };

    const loading = emailLoading || googleLoading || callbackLoading;

    return (
        <View style={authStyles.overlay}>
        <View style={authStyles.modal}>
        <Text style={authStyles.title}>Login</Text>

        <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            style={authStyles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
        />

        <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={authStyles.input}
            autoCapitalize="none"
            editable={!loading}
        />

        <TouchableOpacity
            onPress={handleEmailLogin}
            disabled={loading}
            style={[BUTTON_STYLES.primary, loading && BUTTON_STYLES.disabled]}
            >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Login</Text>
            )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
            <Text style={{ marginHorizontal: 15, color: '#666', fontSize: 14 }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
        </View>

        <TouchableOpacity
            onPress={googleLogin}
            disabled={loading}
            style={[BUTTON_STYLES.google, loading && BUTTON_STYLES.disabled]}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Google Login</Text>
            )}
        </TouchableOpacity>

        <Text
            style={authStyles.link}
            onPress={() => router.push("/register")}
        >
            Don&apos;t have an account? Register
        </Text>
        </View>
        </View>
    );
}
