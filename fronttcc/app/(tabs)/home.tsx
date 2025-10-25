// app/(tabs)/home.tsx
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../config/api";
import AuthContext from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

interface User {
  id: number;
  name?: string;
  role?: "PRODUTOR" | "TAREFEIRO";
  tel?: string;
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

interface AdImage {
  url: string;
}

interface Ad {
  id: number;
  title: string;
  description?: string;
  localizacao?: string;
  user?: User;
  images?: AdImage[];
  createdAt: string; // já vem do back
}

// Haversine para calcular distância
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Formata tempo decorrido
function getTimeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Publicado agora";
  if (diffMinutes < 60) return `Publicado há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Publicado há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  const diffDays = Math.floor(diffHours / 24);
  return `Publicado há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
}

export default function HomeScreen() {
  const { user: userFromContext } = useContext(AuthContext);
  const user = userFromContext as User | null;
  const router = useRouter();

  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [filter, setFilter] = useState<"recent" | "near">("recent");

  // Obter localização
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    })();
  }, []);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await api.get("/questions");
      setQuestions(response.data.filter((q: Question) => q.user.name !== user?.name));
    } catch (error) {
      console.log("Erro ao carregar perguntas:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchAds = async () => {
    setLoadingAds(true);
    try {
      const response = await api.get("/ads");
      setAds(response.data);
    } catch (error) {
      console.log("Erro ao carregar anúncios:", error);
    } finally {
      setLoadingAds(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user?.role === "TAREFEIRO") {
        fetchAds();
        setShowQuestions(false);
      } else {
        fetchQuestions();
      }
    }, [user])
  );

  useEffect(() => {
    if (user?.role === "TAREFEIRO" && showQuestions) fetchQuestions();
  }, [showQuestions]);

  const getQuestionImageURL = (filename: string) => `${api.defaults.baseURL}/uploads/questions/${filename}`;
  const getAdImageURL = (filename: string) => `${api.defaults.baseURL}/uploads/ads/${filename}`;
  const getInitial = (name?: string) => (!name ? "?" : name.charAt(0).toUpperCase());

  const openWhatsApp = (tel?: string) => {
    if (!tel) return;
    const phone = tel.replace(/\D/g, "");
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(err => console.log("Erro ao abrir WhatsApp:", err));
  };

  const openMaps = (localizacao?: string) => {
    if (!localizacao) return;
    try {
      const { latitude, longitude } = JSON.parse(localizacao);
      if (latitude && longitude) {
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url).catch(err => console.log("Erro ao abrir o mapa:", err));
      }
    } catch (error) {
      console.log("Erro ao processar a localização para o mapa:", error);
    }
  };

  // Filtrar e ordenar anúncios
  const sortedAds = [...ads].sort((a, b) => {
    if (filter === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (filter === "near" && userLocation) {
      const aCoords = a.localizacao ? JSON.parse(a.localizacao) : null;
      const bCoords = b.localizacao ? JSON.parse(b.localizacao) : null;
      if (!aCoords || !bCoords) return 0;
      const distA = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, aCoords.latitude, aCoords.longitude);
      const distB = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, bCoords.latitude, bCoords.longitude);
      return distA - distB;
    }
    return 0;
  });

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 30 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerProfile} onPress={() => router.push("/(tabs)/EditProfile")}>
          <View style={styles.avatarLarge}><Text style={styles.avatarLetter}>{getInitial(user?.name)}</Text></View>
          <View>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.username}>{user?.name}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Feather name="bell" size={24} color="#374151" />
          {user?.role === "TAREFEIRO" && (
            <TouchableOpacity onPress={() => setShowQuestions(prev => !prev)} style={{ padding: 6, backgroundColor: "#047857", borderRadius: 8 }}>
              <Feather name={showQuestions ? "list" : "shopping-bag"} size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      {user?.role === "TAREFEIRO" && !showQuestions && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 8, gap: 12 }}>
          <TouchableOpacity onPress={() => setFilter("recent")} style={{ padding: 6, backgroundColor: filter === "recent" ? "#047857" : "#E5E7EB", borderRadius: 8 }}>
            <Text style={{ color: filter === "recent" ? "#fff" : "#374151" }}>Mais Recentes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter("near")} style={{ padding: 6, backgroundColor: filter === "near" ? "#047857" : "#E5E7EB", borderRadius: 8 }}>
            <Text style={{ color: filter === "near" ? "#fff" : "#374151" }}>Mais Perto</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {user?.role === "TAREFEIRO" && !showQuestions ? (
          loadingAds ? (
            <ActivityIndicator size="large" color="#047857" style={{ marginTop: 30 }} />
          ) : sortedAds.length === 0 ? (
            <Text style={styles.noQuestionsText}>Nenhum anúncio disponível.</Text>
          ) : (
            sortedAds.map(ad => {
              const adCoords = ad.localizacao ? JSON.parse(ad.localizacao) : null;
              let distanciaKm: number | null = null;
              if (adCoords && userLocation) {
                distanciaKm = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, adCoords.latitude, adCoords.longitude);
              }

              return (
                <View key={ad.id} style={styles.adCard}>
                  {ad.user?.name && (
                    <View style={styles.postHeader}>
                      <View style={styles.avatarSmall}><Text style={styles.avatarLetter}>{getInitial(ad.user?.name)}</Text></View>
                      <Text style={styles.authorName}>
                        {ad.user.name} {distanciaKm !== null && `· ${distanciaKm.toFixed(1)} km`}
                      </Text>
                    </View>
                  )}

                  <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>{getTimeAgo(ad.createdAt)}</Text>

                  <Text style={styles.adTitle}>{ad.title}</Text>
                  {ad.description && <Text style={styles.adDescription}>{ad.description}</Text>}

                  {ad.images && ad.images.length > 0 && (
                    <FlatList
                      data={ad.images}
                      horizontal
                      keyExtractor={(_, i) => i.toString()}
                      showsHorizontalScrollIndicator={false}
                      renderItem={({ item }) => <Image source={{ uri: getAdImageURL(item.url) }} style={styles.adImage} />}
                      contentContainerStyle={{ gap: 10 }}
                    />
                  )}

                  <View style={styles.adIconsContainer}>
                    {ad.localizacao && <TouchableOpacity style={styles.adIconButton} onPress={() => openMaps(ad.localizacao)}><Feather name="map-pin" size={20} color="#047857" /></TouchableOpacity>}
                    {ad.user?.tel && <TouchableOpacity style={styles.adIconButton} onPress={() => openWhatsApp(ad.user?.tel)}><Feather name="message-circle" size={20} color="#25D366" /></TouchableOpacity>}
                  </View>
                </View>
              );
            })
          )
        ) : loadingQuestions ? (
          <ActivityIndicator size="large" color="#047857" style={{ marginTop: 30 }} />
        ) : questions.length === 0 ? (
          <Text style={styles.noQuestionsText}>Ainda não há perguntas. Seja o primeiro!</Text>
        ) : (
          questions.map(q => (
            <TouchableOpacity
              key={q.id}
              activeOpacity={0.9}
              style={styles.postCard}
              onPress={() => router.replace({ pathname: "/(tabs)/[questionId]", params: { questionId: q.id } })}
            >
              <View style={styles.postHeader}>
                <View style={styles.avatarSmall}><Text style={styles.avatarLetter}>{getInitial(q.user.name)}</Text></View>
                <Text style={styles.authorName}>{q.user.name}</Text>
              </View>

              <Text style={styles.postText}>{q.text}</Text>

              {q.images && q.images.length > 0 && (
                <FlatList
                  data={q.images}
                  horizontal
                  keyExtractor={(_, i) => i.toString()}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => <Image source={{ uri: getQuestionImageURL(item.url) }} style={styles.postImage} />}
                  contentContainerStyle={{ gap: 10 }}
                />
              )}

              <TouchableOpacity
                style={styles.commentButton}
                activeOpacity={0.7}
                onPress={() => router.replace({ pathname: "/(tabs)/[questionId]", params: { questionId: q.id } })}
              >
                <Feather name="message-circle" size={18} color="#047857" />
                <Text style={styles.commentText}>Ver e comentar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB para criar pergunta, para PRODUTOR e TAREFEIRO */}
      {(user?.role === "PRODUTOR" || (user?.role === "TAREFEIRO" && showQuestions)) && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push("/(tabs)/createQuestion")}>
          <Feather name="edit-3" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  headerProfile: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarLarge: { width: 55, height: 55, borderRadius: 28, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center" },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 16, fontWeight: "700", color: "#065F46" },
  greeting: { fontSize: 14, color: "#6B7280" },
  username: { fontSize: 18, fontWeight: "700", color: "#111827" },
  postCard: { backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 10, borderRadius: 18, padding: 14 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  authorName: { fontWeight: "600", fontSize: 15, color: "#111827" },
  postText: { fontSize: 16, color: "#374151", marginBottom: 10, lineHeight: 22 },
  postImage: { width: width * 0.85, height: 200, borderRadius: 12, backgroundColor: "#E5E7EB" },
  commentButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  commentText: { color: "#047857", fontSize: 14, fontWeight: "600" },
  noQuestionsText: { textAlign: "center", color: "#6B7280", marginTop: 40, fontSize: 16 },
  fab: { position: "absolute", bottom: 90, right: 20, backgroundColor: "#047857", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 6 },
  adCard: { backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 10, borderRadius: 18, padding: 14 },
  adTitle: { fontWeight: "700", fontSize: 16, color: "#111827" },
  adDescription: { fontSize: 14, color: "#374151", marginBottom: 10 },
  adImage: { width: width * 0.85, height: 200, borderRadius: 12, backgroundColor: "#E5E7EB" },
  adIconsContainer: { flexDirection: "row", justifyContent: "flex-start", gap: 16, marginTop: 8 },
  adIconButton: { padding: 6, borderRadius: 12, backgroundColor: "#fff", elevation: 2 },
});
