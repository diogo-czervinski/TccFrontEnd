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
  Alert
} from 'react-native';
import api from '../config/api';
import { router, useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'produtor' | 'tarefeiro' | null>(null);

const handleRegister = async () => {
  // 1️⃣ Validação básica no front
  if (!fullName || !email || !password || !phone || !selectedRole) {
    Alert.alert('Erro de Preenchimento', 'Por favor, preencha todos os campos.');
    return;
  }

  // 2️⃣ Monta o objeto que o backend espera
  const userData = {
    name: fullName.trim(),
    email: email.trim(),
    password: password,
    tel: phone.trim(),          // ⚠️ CORRIGIDO: campo tel
    role: selectedRole.toUpperCase(), // PRODUTOR ou TAREFEIRO
  };

  try {
    // 3️⃣ Chamada à API
    const response = await api.post('/user', userData);

    // 4️⃣ Sucesso
    Alert.alert('Sucesso!', 'A sua conta foi criada com sucesso.');
    router.push('/')

  } catch (error: any) {
    // 5️⃣ Tratamento detalhado de erros do backend
    if (error.response) {
      console.error('Erro no backend:', error.response.data);

      if (Array.isArray(error.response.data)) {
        const messages = error.response.data
          .map((e: any) => Object.values(e.constraints || {}).join(', '))
          .join('\n');
        Alert.alert('Erro no Registo', messages || 'Verifique os seus dados e tente novamente.');
      } else if (error.response.data.message) {
        Alert.alert('Erro no Registo', error.response.data.message);
      } else {
        Alert.alert('Erro no Registo', 'Verifique os seus dados e tente novamente.');
      }
    } else {
      console.error('Falha na requisição:', error.message);
      Alert.alert('Erro no Registo', 'Não foi possível conectar ao servidor.');
    }
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Crie a sua conta</Text>
          <Text style={styles.subtitle}>É rápido e fácil!</Text>

          <View style={styles.formContainer}>
            <TextInput
              placeholder='Nome completo'
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              placeholder='O seu e-mail'
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              placeholder='Crie uma senha'
              style={styles.input}
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              placeholder='Telefone'
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.roleTitle}>Qual é o seu perfil?</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'produtor' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('produtor')}
              >
                <Text style={[styles.roleText, selectedRole === 'produtor' && styles.roleTextSelected]}>Produtor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'tarefeiro' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('tarefeiro')}
              >
                <Text style={[styles.roleText, selectedRole === 'tarefeiro' && styles.roleTextSelected]}>Tarefeiro</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={styles.loginLink}>Faça login</Text>
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
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingVertical: 40, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  formContainer: { width: '85%' },
  input: { height: 50, backgroundColor: '#F9FAFB', borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  button: { height: 50, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
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