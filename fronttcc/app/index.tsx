// app/index.tsx
import React, { useState, useContext, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthContext from '@/contexts/AuthContext';
import LogoImage from '../assets/images/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signed, loading } = useContext(AuthContext);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    if (!loading && signed) {
      router.replace('/(tabs)/home');
    }
  }, [loading, signed]);

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    if (!email || !password) return;
    if (!isEmailValid(email)) return;
    if (password.length < 6) return;

    if (isLoading) return;
    setIsLoading(true);

    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      router.replace('/(tabs)/home');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'E-mail ou senha inválidos.';
      Alert.alert('Erro de Login', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const dynamicStyles = {
    container: { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' },
    input: {
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderColor: isDarkMode ? '#374151' : '#D1D5DB',
      color: isDarkMode ? '#F9FAFB' : '#111827',
    },
    placeholder: { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
    title: { color: isDarkMode ? '#F3F4F6' : '#1F2937' },
    subtitle: { color: isDarkMode ? '#D1D5DB' : '#6B7280' },
    registerText: { color: isDarkMode ? '#D1D5DB' : '#6B7280' },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Image style={styles.logo} source={LogoImage} resizeMode="contain" />
          <Text style={[styles.title, dynamicStyles.title]}>Bem-vindo de volta!</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Faça login para continuar
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              placeholder="O seu e-mail"
              placeholderTextColor={dynamicStyles.placeholder.color}
              style={[styles.input, dynamicStyles.input]}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <TextInput
              placeholder="A sua senha"
              placeholderTextColor={dynamicStyles.placeholder.color}
              style={[styles.input, dynamicStyles.input]}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, dynamicStyles.registerText]}>
              Ainda não tem uma conta?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/register')}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingContainer: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logo: { width: 150, height: 150, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  formContainer: { width: '100%', alignItems: 'center' },
  input: {
    width: '90%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: '90%',
    height: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#6EE7B7',
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.7,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, color: '#10B981', fontWeight: 'bold' },
});
