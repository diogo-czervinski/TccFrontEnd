import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IP = '192.168.1.3'; 
const PORT = 3000;

const baseURL =
  Platform.OS === 'android'
    ? `http://${IP}:${PORT}`
    : `http://${IP}:${PORT}`;

const api = axios.create({
  baseURL,
  timeout: 5000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@RNAuth:token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; 
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;