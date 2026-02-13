import React, { useEffect, useLayoutEffect } from "react";
import { View, Text, StyleSheet, Platform, ActivityIndicator, BackHandler, TouchableOpacity, Alert } from "react-native";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { getTokens } from "../src/utils/tokenStorage";
import { logout } from "../src/services/auth.service";
import { useAuth } from "../src/hooks/useAuth";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('Success', 'Logged out successfully!');
      router.replace("/login");
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Logout failed');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutButton}>
          <Text style={styles.headerLogoutButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;

      const handlePopState = () => {
        const { accessToken } = getTokens();
        if (accessToken) {
          window.history.pushState(null, '', '/home');
          router.replace("/home");
        }
      };

      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/home');
        window.history.pushState(null, '', '/home');
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
      }
    }, [])
  );

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/home');
    }
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  text: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
  },
  headerLogoutButton: {
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FF3B30",
  },
  headerLogoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
