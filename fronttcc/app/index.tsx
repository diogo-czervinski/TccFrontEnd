import React, { useState, useContext } from 'react';
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
  Alert
} from 'react-native';

import { useRouter } from 'expo-router'; 
import AuthContext from '@/contexts/AuthContext'; 
import LogoImage from '../assets/images/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn } = useContext(AuthContext);
  const router = useRouter(); 

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Erro', 'Preencha e-mail e senha.');
    return;
  }

  try {
    await signIn({ email, password }); 
    router.replace('/(tabs)/home');     
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'E-mail ou senha inválidos.';
    Alert.alert('Erro de Login', errorMessage);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image
            style={styles.logo}
            source={LogoImage}
            resizeMode="contain"
          />

          <Text style={styles.title}>Bem-vindo de volta!</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
          
          <View style={styles.formContainer}>
            <TextInput 
              placeholder='O seu e-mail' 
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput 
              placeholder='A sua senha' 
              style={styles.input} 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Ainda não tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardAvoidingContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingTop: 80, paddingBottom: 40, paddingHorizontal: 20 },
  logo: { width: 150, height: 150, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 32 },
  formContainer: { width: '100%', alignItems: 'center' },
  input: { width: '90%', height: 50, backgroundColor: '#F9FAFB', borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  button: { width: '90%', height: 50, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  registerText: { fontSize: 14, color: '#6B7280' },
  registerLink: { fontSize: 14, color: '#10B981', fontWeight: 'bold' },
});