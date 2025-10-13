// app/(tabs)/home.tsx
import React, { useContext, useState } from "react";
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
  FlatList,
  Dimensions,
} from "react-native";
import AuthContext from "../../contexts/AuthContext";
import api from "../../config/api";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import BottomNavBar from "@/components/navbar";
import { Feather } from "@expo/vector-icons"; // Ícone para o botão FAB

const { width } = Dimensions.get("window");

// --- Interfaces ---
interface User {
  id: number;
  name: string;
  email: string;
  role: "PRODUTOR" | "TAREFEIRO";
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

// --- Componente Principal ---
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

    // Carregar Perguntas
    try {
      const response = await api.get("/questions");
      setQuestions(response.data);
    } catch (error) {
      console.log("Erro ao carregar perguntas:", error);
    } finally {
      setLoadingQuestions(false);
    }

    // Carregar Clima
    try {
      const WEATHER_API_KEY = "c23e10c4eddc13ce9822754b376ac77e"; // Lembre-se de proteger sua chave API
      const city = "Curitiba";
      const response = await axios.get(
        "https://api.openweathermap.org/data/2.5/weather",
        {
          params: { q: city, appid: WEATHER_API_KEY, units: "metric", lang: "pt_br" },
        }
      );
      const data = response.data;
      setWeather({
        city: data.name,
        temp: `${Math.round(data.main.temp)}°C`,
        condition:
          data.weather[0].description.charAt(0).toUpperCase() +
          data.weather[0].description.slice(1),
        icon: mapWeatherIcon(data.weather[0].icon),
      });
    } catch (error) {
      setErrorWeather("Não foi possível carregar o clima.");
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

  const getInitial = (name?: string) =>
    !name ? "?" : name.charAt(0).toUpperCase();

  const mapWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: string } = {
      "01d": "☀️", "01n": "🌙", "02d": "⛅️", "02n": "☁️", "03d": "☁️", "03n": "☁️",
      "04d": "☁️", "04n": "☁️", "09d": "🌧", "09n": "🌧", "10d": "🌦", "10n": "🌧",
      "11d": "⛈", "11n": "⛈", "13d": "❄️", "13n": "❄️", "50d": "🌫", "50n": "🌫",
    };
    return iconMap[iconCode] || "❓";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Olá, {user?.name}!</Text>
            <Text style={styles.headerSubtitle}>Bem-vindo à comunidade.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/EditProfile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{getInitial(user?.name)}</Text>
            </View>
          </TouchableOpacity>
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
          questions.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.questionCard}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/[questionId]",
                  params: { questionId: q.id },
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.questionContent}>
                <Text style={styles.questionText} numberOfLines={3}>{q.text}</Text>
                <Text style={styles.questionAuthor}>
                  por {q.user?.name || "Autor desconhecido"}
                </Text>
              </View>
              {q.images && q.images.length > 0 && (
                <QuestionCarousel
                  images={q.images.map((img) => getQuestionImageURL(img.url))}
                />
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/(tabs)/createQuestion")}
      >
        <Feather name="plus" size={30} color="white" />
      </Pressable>

      {user?.role && <BottomNavBar />}
    </SafeAreaView>
  );
}

// --- Componente do Carrossel (CORRIGIDO) ---
function QuestionCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  const cardWidth = width - 40;
  const imageWidth = cardWidth - 20;
  const snapInterval = imageWidth + 10;

  const handleScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    setIndex(newIndex);
  };

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        data={images}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={{ width: imageWidth, marginRight: 10 }}>
            <Image source={{ uri: item }} style={styles.carouselImage} />
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, index === i && styles.activeDot]} />
          ))}
        </View>
      )}
    </View>
  );
}

// --- ESTILOS (COM CORREÇÕES) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 16, color: "#6B7280" },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: "#E5E7EB",
    justifyContent: "center", alignItems: "center",
  },
  avatarLetter: { fontSize: 20, fontWeight: "bold", color: "#374151" },
  weatherCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#059669", borderRadius: 20, padding: 24, marginHorizontal: 24,
    elevation: 10, shadowColor: "#059669", shadowOpacity: 0.4,
    shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, minHeight: 120,
  },
  weatherTitle: { fontSize: 16, color: "#A7F3D0" },
  weatherCity: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF", marginTop: 4 },
  weatherCondition: { fontSize: 14, color: "#FFFFFF", marginTop: 12 },
  weatherTempContainer: { alignItems: "center" },
  weatherIcon: { fontSize: 32 },
  weatherTemp: { fontSize: 36, fontWeight: "bold", color: "#FFFFFF" },
  errorTextSmall: { color: "#FFFFFF", textAlign: "center", flex: 1 },
  sectionHeader: { paddingHorizontal: 24, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  noQuestionsText: {
    textAlign: "center", color: "#6B7280", margin: 30, fontSize: 16,
  },
  fab: {
    position: "absolute", width: 60, height: 60, alignItems: "center",
    justifyContent: "center", right: 30, bottom: 90, backgroundColor: "#059669",
    borderRadius: 30, elevation: 8, shadowColor: "#000", shadowOpacity: 0.3,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },

  // --- Estilos do Card e Carrossel Corrigidos ---
  questionCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 20,
    marginHorizontal: 20, marginBottom: 16, borderWidth: 1,
    borderColor: "#E5E7EB", overflow: 'hidden',
  },
  questionContent: {
    marginBottom: 12, paddingHorizontal: 20,
  },
  questionText: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  questionAuthor: { fontSize: 14, color: "#6B7280", marginTop: 8 },
  carouselContainer: {
    marginTop: 12,
  },
  carouselImage: {
    width: '100%', height: 200, borderRadius: 12, backgroundColor: '#E5E7EB',
  },
  dots: {
    flexDirection: "row", justifyContent: "center", marginTop: 12,
    paddingHorizontal: 20,
  },
  dot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#D1D5DB", marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#059669", width: 10, height: 10, borderRadius: 5,
  },
});