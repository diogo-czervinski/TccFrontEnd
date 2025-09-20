import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'PRODUTOR' | 'TAREFEIRO';
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  signIn(credentials: object): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storagedUser = await AsyncStorage.getItem('@RNAuth:user');
      const storagedToken = await AsyncStorage.getItem('@RNAuth:token');

      if (storagedUser && storagedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`;
        setUser(JSON.parse(storagedUser));
      }
      setLoading(false);
    }
    loadStorageData();
  }, []);

  async function signIn(credentials: object) {
    try {
      const response = await api.post('/login', credentials);
      const { access_token } = response.data;

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      const profileResponse = await api.get('/user/profile/me');
      const user: User = profileResponse.data;

      setUser(user);
      await AsyncStorage.setItem('@RNAuth:user', JSON.stringify(user));
      await AsyncStorage.setItem('@RNAuth:token', access_token);
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

  async function signOut() {
    await AsyncStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;