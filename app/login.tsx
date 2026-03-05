import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, signIn, isLoading, signUpError, signInError } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchMode = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError(null);

    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, inviteCode.trim() || undefined);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong';
      setError(msg);
      console.log('[LoginScreen] Auth error:', msg);
    }
  };

  const displayError = error || (mode === 'login' ? signInError : signUpError);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D1117',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingTop: insets.top + 40,
      paddingBottom: insets.bottom + 40,
    },
    header: {
      marginBottom: 48,
    },
    appName: {
      fontSize: 32,
      fontWeight: '200' as const,
      color: '#FFFFFF',
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    appNameBold: {
      fontWeight: '600' as const,
      color: '#26A69A',
    },
    tagline: {
      fontSize: 15,
      color: '#8B949E',
      fontStyle: 'italic' as const,
      fontWeight: '300' as const,
      letterSpacing: 0.3,
    },
    formCard: {
      backgroundColor: '#161B22',
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: '#21262D',
    },
    modeTitle: {
      fontSize: 22,
      fontWeight: '500' as const,
      color: '#FFFFFF',
      marginBottom: 24,
      letterSpacing: -0.3,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: '#8B949E',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    input: {
      backgroundColor: '#0D1117',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#21262D',
      marginBottom: 18,
    },
    inputFocused: {
      borderColor: '#26A69A',
    },
    inviteLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: '#8B949E',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    inviteHint: {
      fontSize: 11,
      color: '#484F58',
      fontStyle: 'italic' as const,
      marginTop: -12,
      marginBottom: 18,
    },
    errorText: {
      fontSize: 13,
      color: '#FF4D6D',
      marginBottom: 16,
      textAlign: 'center' as const,
    },
    submitButton: {
      backgroundColor: '#26A69A',
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center' as const,
      marginTop: 4,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
      gap: 4,
    },
    switchText: {
      fontSize: 14,
      color: '#8B949E',
    },
    switchLink: {
      fontSize: 14,
      color: '#26A69A',
      fontWeight: '600' as const,
    },
    skipRow: {
      marginTop: 16,
      alignItems: 'center' as const,
    },
    skipText: {
      fontSize: 13,
      color: '#484F58',
      fontStyle: 'italic' as const,
    },
  }), [insets]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>
            Effective <Text style={styles.appNameBold}>Day</Text>
          </Text>
          <Text style={styles.tagline}>Track your time. Master your life.</Text>
        </View>

        <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
          <Text style={styles.modeTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor="#484F58"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="login-email"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor="#484F58"
            secureTextEntry
            testID="login-password"
          />

          {mode === 'signup' && (
            <>
              <Text style={styles.inviteLabel}>Invite Code (optional)</Text>
              <TextInput
                style={styles.input}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter code for premium"
                placeholderTextColor="#484F58"
                autoCapitalize="none"
                testID="login-invite"
              />
              <Text style={styles.inviteHint}>Have an invite code? Enter it to unlock premium features.</Text>
            </>
          )}

          {displayError && <Text style={styles.errorText}>{displayError}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
            testID="login-submit"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={switchMode}>
            <Text style={styles.switchLink}>
              {mode === 'login' ? ' Sign Up' : ' Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
