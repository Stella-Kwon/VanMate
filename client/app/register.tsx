import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import authStyles from "../src/styles/AuthStyles";
import { API_BASE_URL } from "../src/utils/api";
import { validateEmail, validatePassword, getPasswordErrorMessage } from "../src/utils/validation";
import { parseErrorResponse, isNetworkError } from "../src/utils/errors";
import { showAlert } from "../src/utils/alert";

interface RegisterForm {
  givenName: string;
  familyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const BUTTON_STYLES = {
  primary: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabled: { backgroundColor: '#ccc' },
} as const;

export default function RegisterScreen() {
  const [form, setForm] = useState<RegisterForm>({
    givenName: "",
    familyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = <K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    const { givenName, familyName, email, password, confirmPassword } = form;

    if (!givenName || !familyName || !email || !password || !confirmPassword) {
      return 'Please fill in all fields';
    }

    if (!validateEmail(email)) {
      return 'Please enter a valid email address';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    if (!validatePassword(password)) {
      return getPasswordErrorMessage();
    }

    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      showAlert('Error', validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          given_name: form.givenName,
          family_name: form.familyName,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
      }

      Alert.alert('Success', 'Registration successful! Please login.');
      router.push("/login");
    } catch (error: any) {
      if (isNetworkError(error)) {
        showAlert('Network Error', 'Cannot connect to server. Please check your connection.');
      } else {
        showAlert('Error', error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={authStyles.overlay}
      keyboardShouldPersistTaps="handled"
    >
      <View style={authStyles.modal}>
        <Text style={authStyles.title}>Register</Text>

        <TextInput
          placeholder="First Name"
          placeholderTextColor="#999"
          value={form.givenName}
          onChangeText={(value) => updateField('givenName', value)}
          style={authStyles.input}
          autoCapitalize="words"
          textContentType="givenName"
          editable={!loading}
        />

        <TextInput
          placeholder="Last Name"
          placeholderTextColor="#999"
          value={form.familyName}
          onChangeText={(value) => updateField('familyName', value)}
          style={authStyles.input}
          autoCapitalize="words"
          textContentType="familyName"
          editable={!loading}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={form.email}
          onChangeText={(value) => updateField('email', value)}
          style={authStyles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          editable={!loading}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={form.password}
          onChangeText={(value) => updateField('password', value)}
          style={authStyles.input}
          autoCapitalize="none"
          {...(Platform.OS === 'ios' ? { 
            textContentType: 'none', 
            autoComplete: 'off',
            passwordRules: ''
          } : {})}
          editable={!loading}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={form.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          style={authStyles.input}
          autoCapitalize="none"
          {...(Platform.OS === 'ios' ? { 
            textContentType: 'none', 
            autoComplete: 'off',
            passwordRules: ''
          } : {})}
          editable={!loading}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={[BUTTON_STYLES.primary, loading && BUTTON_STYLES.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Register</Text>
          )}
        </TouchableOpacity>

        <Text
          style={authStyles.link}
          onPress={() => router.push("/login")}
        >
          Already have an account? Login
        </Text>
      </View>
    </ScrollView>
  );
}
