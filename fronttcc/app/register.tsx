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
  ActivityIndicator,
  useColorScheme,
  Image,
} from 'react-native';
import api from '../config/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'produtor' | 'tarefeiro' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState<any>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // --- Validações ---
  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 11;
  };

  // --- Formatação do Telefone ---
  const formatPhoneNumber = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    setPhone(digitsOnly);

    let formatted = '';
    if (digitsOnly.length > 0) formatted = '(' + digitsOnly.substring(0, 2);
    if (digitsOnly.length > 2 && digitsOnly.length <= 7) {
      formatted += ') ' + digitsOnly.substring(2, 7);
    } else if (digitsOnly.length > 7 && digitsOnly.length === 11) {
      formatted += ') ' + digitsOnly.substring(2, 7);
      formatted += '-' + digitsOnly.substring(7, 11);
    } else if (digitsOnly.length > 2 && digitsOnly.length <= 6) {
      formatted += ') ' + digitsOnly.substring(2, 6);
    } else if (digitsOnly.length > 6 && digitsOnly.length === 10) {
      formatted += ') ' + digitsOnly.substring(2, 6);
      formatted += '-' + digitsOnly.substring(6, 10);
    } else if (digitsOnly.length > 7) {
      const firstPartLength = digitsOnly.length >= 11 ? 5 : 4;
      formatted += ') ' + digitsOnly.substring(2, 2 + firstPartLength);
      if (digitsOnly.length > 2 + firstPartLength) {
        formatted += '-' + digitsOnly.substring(2 + firstPartLength, 2 + firstPartLength + 4);
      }
    }

    setFormattedPhone(formatted);
  };

  // --- Seleção de imagem de perfil ---
  const handleSelectAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos da galeria para selecionar a foto de perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  // --- Registro ---
  const handleRegister = async () => {
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
    if (!isPhoneValid(phone)) {
      Alert.alert('Telefone Inválido', 'Por favor, insira um telefone válido com DDD.');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      let data: any;
      if (avatar) {
        data = new FormData();
        data.append('name', fullName.trim());
        data.append('email', email.trim());
        data.append('password', password);
        data.append('tel', phone);
        data.append('role', selectedRole.toUpperCase());
        // Adiciona avatar
        data.append('avatar', {
          uri: avatar.uri,
          name: avatar.fileName || `avatar.jpg`,
          type: avatar.type || 'image/jpeg',
        });
      } else {
        data = {
          name: fullName.trim(),
          email: email.trim(),
          password,
          tel: phone,
          role: selectedRole.toUpperCase(),
        };
      }

      await api.post('/user', data, avatar ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
      Alert.alert('Sucesso!', 'A sua conta foi criada com sucesso.');
      router.push('/');
    } catch (error: any) {
      if (error.response) {
        if (Array.isArray(error.response.data.message)) {
          const messages = error.response.data.message.join('\n');
          Alert.alert('Erro no Cadastro', messages || 'Verifique seus dados e tente novamente.');
        } else if (error.response.data.message) {
          Alert.alert('Erro no Cadastro', error.response.data.message);
        } else {
          Alert.alert('Erro no Cadastro', 'Verifique seus dados e tente novamente.');
        }
      } else {
        Alert.alert('Erro no Cadastro', 'Não foi possível conectar ao servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Estilos dinâmicos baseados no tema ---
  const dynamicStyles = {
    container: {
      backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
    },
    input: {
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderColor: isDarkMode ? '#374151' : '#D1D5DB',
      color: isDarkMode ? '#F9FAFB' : '#111827',
    },
    placeholder: {
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    title: {
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    },
    subtitle: {
      color: isDarkMode ? '#D1D5DB' : '#6B7280',
    },
    roleTitle: {
      color: isDarkMode ? '#E5E7EB' : '#374151',
    },
    roleButton: {
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderColor: isDarkMode ? '#374151' : '#D1D5DB',
    },
    roleText: {
      color: isDarkMode ? '#E5E7EB' : '#374151',
    },
    loginText: {
      color: isDarkMode ? '#D1D5DB' : '#6B7280',
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, dynamicStyles.title]}>Crie a sua conta</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>É rápido e fácil!</Text>

          <View style={styles.formContainer}>
            {/* Campo de seleção de avatar */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity onPress={handleSelectAvatar} disabled={isLoading} style={{ marginBottom: 8 }}>
                {avatar ? (
                  <Image
                    source={{ uri: avatar.uri }}
                    style={styles.avatarPreview}
                  />
                ) : (
                  <View style={styles.avatarPreview}>
                    <Text style={{ color: '#6B7280', textAlign: 'center' }}>Selecionar foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Foto de perfil</Text>
            </View>

            <TextInput
              placeholder="Nome completo"
              placeholderTextColor={dynamicStyles.placeholder.color}
              style={[styles.input, dynamicStyles.input]}
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading}
            />
            <TextInput
              placeholder="O seu e-mail"
              placeholderTextColor={dynamicStyles.placeholder.color}
              style={[styles.input, dynamicStyles.input]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <TextInput
              placeholder="Crie uma senha (mínimo 6 caracteres)"
              placeholderTextColor={dynamicStyles.placeholder.color}
              style={[styles.input, dynamicStyles.input]}
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            <TextInput
              placeholder="Telefone com DDD (Ex: (11) 98765-4321)"
              placeholderTextColor={dynamicStyles.placeholder.color}
              style={[styles.input, dynamicStyles.input]}
              keyboardType="phone-pad"
              value={formattedPhone}
              onChangeText={formatPhoneNumber}
              editable={!isLoading}
              maxLength={15}
            />

            <Text style={[styles.roleTitle, dynamicStyles.roleTitle]}>Qual é o seu perfil?</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, dynamicStyles.roleButton, selectedRole === 'produtor' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('produtor')}
                disabled={isLoading}
              >
                <Text style={[styles.roleText, dynamicStyles.roleText, selectedRole === 'produtor' && styles.roleTextSelected]}>
                  Produtor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, dynamicStyles.roleButton, selectedRole === 'tarefeiro' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('tarefeiro')}
                disabled={isLoading}
              >
                <Text style={[styles.roleText, dynamicStyles.roleText, selectedRole === 'tarefeiro' && styles.roleTextSelected]}>
                  Tarefeiro
                </Text>
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
            <Text style={[styles.loginText, dynamicStyles.loginText]}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/')} disabled={isLoading}>
              <Text style={styles.loginLink}>Faça login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Estilos base ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingVertical: 40, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  formContainer: { width: '85%' },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  button: { height: 50, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
  buttonDisabled: { backgroundColor: '#6EE7B7', elevation: 0, shadowOpacity: 0 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  roleTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  roleButton: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 8, marginHorizontal: 4 },
  roleButtonSelected: { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
  roleText: { fontSize: 14, fontWeight: '600' },
  roleTextSelected: { color: '#065F46' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, color: '#10B981', fontWeight: 'bold' },
  avatarPreview: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
});