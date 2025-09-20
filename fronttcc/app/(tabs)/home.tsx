import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import AuthContext from '../../contexts/AuthContext';
import api from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import BottomNavBar from '@/components/navbar';



interface User {
  id: number;
  name: string;
  email: string;
  role: 'PRODUTOR' | 'TAREFEIRO';
}

interface QuestionImage {
  url: string;
}

interface Question {
  id: number;
  text: string;
  user: { name: string };
  images?: QuestionImage[];
}

interface WeatherData {
  city: string;
  temp: string;
  condition: string;
  icon: string;
}

export default function HomeScreen() {
  const { user: userFromContext } = useContext(AuthContext);
  const user = userFromContext as User | null;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [errorWeather, setErrorWeather] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    setLoadingQuestions(true);
    setLoadingWeather(true);

    // Buscar perguntas
    try {
      const response = await api.get('/questions');
      setQuestions(response.data);
    } catch (error) {
      console.log('Erro ao carregar perguntas:', error);
    } finally {
      setLoadingQuestions(false);
    }
    try {
      const WEATHER_API_KEY = 'c23e10c4eddc13ce9822754b376ac77e';
      const city = 'Curitiba';
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { q: city, appid: WEATHER_API_KEY, units: 'metric', lang: 'pt_br' },
      });
      const data = response.data;
      setWeather({
        city: data.name,
        temp: `${Math.round(data.main.temp)}°C`,
        condition: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
        icon: mapWeatherIcon(data.weather[0].icon),
      });
    } catch (error) {
      setErrorWeather('Não foi possível carregar o clima.');
    } finally {
      setLoadingWeather(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const getQuestionImageURL = (filename: string) =>
    `${api.defaults.baseURL}/uploads/questions/${filename}`;

  const getInitial = (name?: string) => (!name ? '?' : name.charAt(0).toUpperCase());

  const mapWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙', '02d': '⛅️', '02n': '☁️', '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️', '09d': '🌧', '09n': '🌧', '10d': '🌦', '10n': '🌧',
      '11d': '⛈', '11n': '⛈', '13d': '❄️', '13n': '❄️', '50d': '🌫', '50n': '🌫',
    };
    return iconMap[iconCode] || '❓';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Olá, {user?.name}!</Text>
            <Text style={styles.headerSubtitle}>Bem-vindo à comunidade.</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{getInitial(user?.name)}</Text>
          </View>
        </View>
        <View style={styles.weatherCard}>
          {loadingWeather ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : errorWeather ? (
            <Text style={styles.errorTextSmall}>{errorWeather}</Text>
          ) : (
            <>
              <View>
                <Text style={styles.weatherTitle}>Clima Atual</Text>
                <Text style={styles.weatherCity}>{weather?.city}</Text>
                <Text style={styles.weatherCondition}>{weather?.condition}</Text>
              </View>
              <View style={styles.weatherTempContainer}>
                <Text style={styles.weatherIcon}>{weather?.icon}</Text>
                <Text style={styles.weatherTemp}>{weather?.temp}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fórum da Comunidade</Text>
        </View>

        {loadingQuestions ? (
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />
        ) : questions.length === 0 ? (
          <Text style={styles.noQuestionsText}>
            Ainda não há perguntas. Seja o primeiro a publicar!
          </Text>
        ) : (
          questions.map((q) => {
            const images = q.images || [];
            return (
              <TouchableOpacity
                key={q.id}
                style={styles.questionCard}
                onPress={() => router.replace({
                  pathname: '/(tabs)/[questionId]',
                  params: { questionId: q.id }
                })}
                activeOpacity={0.8}
              >
                <View style={styles.questionContent}>
                  <Text style={styles.questionText}>{q.text}</Text>
                  <Text style={styles.questionAuthor}>
                    por {q.user?.name || 'Autor desconhecido'}
                  </Text>
                </View>

                {images.length === 1 ? (
                  <View style={styles.singleImageContainer}>
                    <Image
                      source={{ uri: getQuestionImageURL(images[0].url) }}
                      style={styles.singleImage}
                    />
                  </View>
                ) : images.length <= 3 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imagesScroll}
                  >
                    {images.map((img, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: getQuestionImageURL(img.url) }}
                        style={styles.questionImage}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.gridContainer}>
                    {images.map((img, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: getQuestionImageURL(img.url) }}
                        style={styles.gridImage}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(tabs)/createQuestion')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {user?.role && <BottomNavBar />}
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 16, color: '#6B7280' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 20, fontWeight: 'bold', color: '#374151' },

  weatherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    elevation: 10,
    shadowColor: '#059669',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    minHeight: 120,
  },
  weatherTitle: { fontSize: 16, color: '#A7F3D0' },
  weatherCity: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4 },
  weatherCondition: { fontSize: 14, color: '#FFFFFF', marginTop: 12 },
  weatherTempContainer: { alignItems: 'center' },
  weatherIcon: { fontSize: 32 },
  weatherTemp: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  errorTextSmall: { color: '#FFFFFF', textAlign: 'center', flex: 1 },

  sectionHeader: { paddingHorizontal: 24, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },

  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionContent: { marginBottom: 12 },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  questionAuthor: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  singleImageContainer: { alignItems: 'center', marginTop: 12 },
  singleImage: { width: '90%', height: 200, borderRadius: 12 },

  imagesScroll: { flexDirection: 'row', marginTop: 12 },
  questionImage: { width: 150, height: 150, borderRadius: 12, marginRight: 8 },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  gridImage: { width: '48%', height: 120, borderRadius: 12, marginBottom: 8 },

  noQuestionsText: { textAlign: 'center', color: '#6B7280', margin: 30, fontSize: 16 },

  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 90, // <- antes era 30, agora sobe acima da navbar
    backgroundColor: '#059669',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  fabText: { fontSize: 30, color: 'white' },
});