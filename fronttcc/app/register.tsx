import React, { useState } from 'react';
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
  Alert,
  ActivityIndicator // Importado para o loading
} from 'react-native';
import api from '../config/api';
import { useRouter } from 'expo-router'; // Importado useRouter uma vez

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); // Armazena apenas os dígitos
  const [formattedPhone, setFormattedPhone] = useState(''); // Armazena o valor formatado para exibição
  const [selectedRole, setSelectedRole] = useState<'produtor' | 'tarefeiro' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // --- Funções de Validação ---
  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isPhoneValid = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, ''); // Remove não-dígitos
    return digitsOnly.length >= 10 && digitsOnly.length <= 11; // Valida DDD + 8 ou 9 dígitos
  };

  // --- Função para Formatar Telefone ---
  const formatPhoneNumber = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    setPhone(digitsOnly); // Atualiza o estado 'phone' com os dígitos

    let formatted = '';
    if (digitsOnly.length > 0) {
      formatted = '(' + digitsOnly.substring(0, 2);
    }
    // Formatação para celular (11 dígitos): (XX) XXXXX-XXXX
    if (digitsOnly.length > 2 && digitsOnly.length <= 7) { // Primeiros 5 digitos do número
      formatted += ') ' + digitsOnly.substring(2, 7);
    } else if (digitsOnly.length > 7 && digitsOnly.length === 11) { // Completa celular
      formatted += ') ' + digitsOnly.substring(2, 7);
      formatted += '-' + digitsOnly.substring(7, 11);
    } 
    // Formatação para telefone fixo ou celular antigo (10 dígitos): (XX) XXXX-XXXX
    else if (digitsOnly.length > 2 && digitsOnly.length <= 6) { // Primeiros 4 digitos do número
        formatted += ') ' + digitsOnly.substring(2, 6);
    } else if (digitsOnly.length > 6 && digitsOnly.length === 10) { // Completa fixo/celular antigo
        formatted += ') ' + digitsOnly.substring(2, 6);
        formatted += '-' + digitsOnly.substring(6, 10);
    }
    // Caso intermediário ou mais longo (continua adicionando o que for possível)
     else if (digitsOnly.length > 7) { 
        // Decide se coloca 4 ou 5 digitos antes do hífen baseado no tamanho total
        const firstPartLength = digitsOnly.length >= 11 ? 5 : 4; 
        formatted += ') ' + digitsOnly.substring(2, 2 + firstPartLength);
        if (digitsOnly.length > 2 + firstPartLength) {
             formatted += '-' + digitsOnly.substring(2 + firstPartLength, 2 + firstPartLength + 4);
        }
    }


    setFormattedPhone(formatted); // Atualiza o estado para exibição
  };

  const handleRegister = async () => {
    // Validações (usam 'phone' - só dígitos)
    if (!fullName || !email || !password || !phone || !selectedRole) {
      Alert.alert('Erro de Preenchimento', 'Por favor, preencha todos os campos.');
      return;
    }
    if (fullName.trim().length < 3) {
      Alert.alert('Nome Inválido', 'Por favor, insira seu nome completo.');
      return;
    }
    if (!isEmailValid(email.trim())) {
      Alert.alert('E-mail Inválido', 'Por favor, insira um endereço de e-mail válido.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha Inválida', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!isPhoneValid(phone)) { // Valida usando 'phone'
      Alert.alert('Telefone Inválido', 'Por favor, insira um telefone válido com DDD (10 ou 11 dígitos).');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    const userData = {
      name: fullName.trim(),
      email: email.trim(),
      password: password,
      tel: phone, // Envia só os dígitos
      role: selectedRole.toUpperCase(),
    };

    try {
      await api.post('/user', userData);
      Alert.alert('Sucesso!', 'A sua conta foi criada com sucesso.');
      router.push('/');
    } catch (error: any) {
      // Tratamento de erro do backend (sem alteração)
      if (error.response) {
        console.error('Erro no backend:', error.response.data);
        if (Array.isArray(error.response.data.message)) {
          const messages = error.response.data.message.join('\n');
          Alert.alert('Erro no Cadastro', messages || 'Verifique seus dados e tente novamente.');
        } else if (error.response.data.message) {
          Alert.alert('Erro no Cadastro', error.response.data.message);
        } else {
          Alert.alert('Erro no Cadastro', 'Verifique seus dados e tente novamente.');
        }
      } else {
        console.error('Falha na requisição:', error.message);
        Alert.alert('Erro no Cadastro', 'Não foi possível conectar ao servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Crie a sua conta</Text>
          <Text style={styles.subtitle}>É rápido e fácil!</Text>

          <View style={styles.formContainer}>
            <TextInput
              placeholder='Nome completo'
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading}
            />
            <TextInput
              placeholder='O seu e-mail'
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <TextInput
              placeholder='Crie uma senha (mínimo 6 caracteres)'
              style={styles.input}
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            {/* TextInput de Telefone ATUALIZADO */}
            <TextInput
              placeholder='Telefone com DDD (Ex: (11) 98765-4321)'
              style={styles.input}
              keyboardType="phone-pad"
              value={formattedPhone} // Mostra o valor formatado
              onChangeText={formatPhoneNumber} // Chama a função de formatação
              editable={!isLoading}
              maxLength={15} // (XX) XXXXX-XXXX tem 15 caracteres
            />

            <Text style={styles.roleTitle}>Qual é o seu perfil?</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'produtor' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('produtor')}
                disabled={isLoading}
              >
                <Text style={[styles.roleText, selectedRole === 'produtor' && styles.roleTextSelected]}>Produtor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'tarefeiro' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('tarefeiro')}
                disabled={isLoading}
              >
                <Text style={[styles.roleText, selectedRole === 'tarefeiro' && styles.roleTextSelected]}>Tarefeiro</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/')} disabled={isLoading}>
              <Text style={styles.loginLink}>Faça login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Estilos (sem alteração)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardAvoidingContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingVertical: 40, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  formContainer: { width: '85%' },
  input: { height: 50, backgroundColor: '#F9FAFB', borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  button: { height: 50, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
  buttonDisabled: { backgroundColor: '#6EE7B7', elevation: 0, shadowOpacity: 0 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  roleTitle: { fontSize: 16, color: '#374151', fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  roleButton: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 8, marginHorizontal: 4 },
  roleButtonSelected: { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
  roleText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  roleTextSelected: { color: '#065F46' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: '#6B7280' },
  loginLink: { fontSize: 14, color: '#10B981', fontWeight: 'bold' },
});