import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IP = '192.168.1.9'; // SEU IP local
const PORT = 3000;

// Sua configuração de baseURL está correta, vamos mantê-la
const baseURL =
  Platform.OS === 'android'
    ? `http://${IP}:${PORT}`
    : `http://${IP}:${PORT}`;

const api = axios.create({
  baseURL,
  timeout: 5000,
});

// ⭐ ADIÇÃO IMPORTANTE: Interceptor para autenticação
// Este trecho será executado ANTES de cada requisição
api.interceptors.request.use(
  async (config) => {
    // Busca o token salvo no AsyncStorage
    const token = await AsyncStorage.getItem('@RNAuth:token');

    // Se o token existir, ele é adicionado ao cabeçalho da requisição
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // A requisição continua com o cabeçalho modificado
  },
  (error) => {
    // Caso ocorra um erro na configuração
    return Promise.reject(error);
  }
);

export default api;