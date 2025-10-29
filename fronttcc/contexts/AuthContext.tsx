import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { AxiosError } from 'axios';
import { Alert, ActivityIndicator, View } from 'react-native';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'PRODUTOR' | 'TAREFEIRO';
  tel?: string;
  avatarUrl?: string;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  signIn(credentials: { email: string; password: string }): Promise<void>;
  signOut(): Promise<void>;
  updateUser(user: Partial<User>): void;
  reloadUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Verifica se há token e usuário salvos
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storagedUser = await AsyncStorage.getItem('@RNAuth:user');
        const storagedToken = await AsyncStorage.getItem('@RNAuth:token');

        if (storagedUser && storagedToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`;

          // Testa se o token ainda é válido
          const profileResponse = await api.get('/user/profile/me');
          const freshUser: User = profileResponse.data;
          setUser(freshUser);
          await AsyncStorage.setItem('@RNAuth:user', JSON.stringify(freshUser));
        }
      } catch (error) {
        console.log('⚠️ Token expirado ou inválido, limpando dados...');
        await AsyncStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  // ✅ Função de login
  async function signIn(credentials: { email: string; password: string }) {
    try {
      const response = await api.post('/login', credentials);
      const { access_token } = response.data;

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      await AsyncStorage.setItem('@RNAuth:token', access_token);

      const profileResponse = await api.get('/user/profile/me');
      const loggedUser: User = profileResponse.data;
      setUser(loggedUser);
      await AsyncStorage.setItem('@RNAuth:user', JSON.stringify(loggedUser));
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const backendMessage =
          error.response.data?.message || 'Erro ao comunicar com o servidor.';
        throw new Error(backendMessage);
      } else {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
    }
  }

  // ✅ Logout
  async function signOut() {
    await AsyncStorage.clear();
    setUser(null);
  }

  // ✅ Atualiza dados locais do usuário
  function updateUser(updatedUser: Partial<User>) {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const newUser = { ...currentUser, ...updatedUser };
      AsyncStorage.setItem('@RNAuth:user', JSON.stringify(newUser));
      return newUser;
    });
  }

  // ✅ Recarrega perfil mais recente
  async function reloadUser() {
    try {
      const profileResponse = await api.get('/user/profile/me');
      const freshUser: User = profileResponse.data;
      setUser(freshUser);
      await AsyncStorage.setItem('@RNAuth:user', JSON.stringify(freshUser));
    } catch (error) {
      console.error('❌ Falha ao recarregar os dados do usuário:', error);
    }
  }

  // ✅ Mostra tela de carregamento enquanto verifica o token
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        signIn,
        signOut,
        updateUser,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
