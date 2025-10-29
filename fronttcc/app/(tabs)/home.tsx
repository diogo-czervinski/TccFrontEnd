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
  Alert,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../config/api";
import AuthContext from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import Modal from "react-native-modal";
import ImageViewer from "react-native-image-zoom-viewer";
import AntDesign from '@expo/vector-icons/AntDesign';

const { width } = Dimensions.get("window");

// Ajuste da interface: agora inclui avatarUrl
interface User {
  id: number;
  name?: string;
  role?: "PRODUTOR" | "TAREFEIRO";
  tel?: string;
  avatarUrl?: string;
}

interface QuestionImage {
  url: string;
}

interface Question {
  id: number;
  text: string;
  user: User; // agora espera avatarUrl
  images?: QuestionImage[];
  createdAt: string;
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
  createdAt: string;
}

// Função utilitária para mostrar avatar ou inicial
function UserAvatar({ avatarUrl, name, size = 40 }: { avatarUrl?: string, name?: string, size?: number }) {
  if (avatarUrl) {
    // Se vier /uploads, corrige para URL completa (ajuste conforme API)
    const src = avatarUrl.startsWith('http') ? avatarUrl : `${api.defaults.baseURL}${avatarUrl}`;
    return (
      <Image
        source={{ uri: src }}
        style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: "#E5E7EB",
        }}
      />
    );
  }
  // Senão, mostra inicial
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center"
    }}>
      <Text style={{ color: "#065F46", fontWeight: "bold", fontSize: size / 2 }}>
        {name ? name.charAt(0).toUpperCase() : "?"}
      </Text>
    </View>
  );
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  const { user: userFromContext, signOut } = useContext(AuthContext);
  const user = userFromContext as User | null;
  const router = useRouter();

  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [filter, setFilter] = useState<"recent" | "near">("recent");

  // Modal for zoom/carousel
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adModalImages, setAdModalImages] = useState<{url: string}[]>([]);
  const [adModalIndex, setAdModalIndex] = useState(0);

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

  const openWhatsApp = (tel?: string) => {
    if (!tel) {
      Alert.alert('Contato Indisponível', 'Este anunciante não forneceu um número de telefone.');
      return;
    }
    let phoneDigits = tel.replace(/\D/g, '');
    if (!phoneDigits.startsWith('55')) {
      if (phoneDigits.length === 10 || phoneDigits.length === 11) {
        phoneDigits = '55' + phoneDigits;
      } else {
        Alert.alert('Número Inválido', 'O formato do número de telefone não é reconhecido.');
        return;
      }
    }
    const url = `https://wa.me/${phoneDigits}`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'));
  };

  const openMaps = (localizacao?: string) => {
    if (!localizacao) return;
    try {
      const { latitude, longitude } = JSON.parse(localizacao);
      if (latitude && longitude) {
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url);
      }
    } catch (error) {
      console.log("Erro ao processar a localização para o mapa:", error);
    }
  };

  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );

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

  // Modal logic for zoom and carousel
  const handleOpenAdImages = (images: AdImage[], index: number = 0) => {
    setAdModalImages(images.map(img => ({ url: getAdImageURL(img.url) })));
    setAdModalIndex(index);
    setAdModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 30 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerProfile} onPress={() => router.push("/(tabs)/EditProfile")}>
          {/* Avatar do usuário logado */}
          <UserAvatar avatarUrl={user?.avatarUrl} name={user?.name} size={55} />
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
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Sair",
                "Tem certeza que deseja sair?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Sair", style: "destructive", onPress: async () => {
                      await signOut(); 
                      router.replace("/"); 
                    }
                  }
                ]
              );
            }}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {user?.role === "PRODUTOR" && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar dúvidas..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Perguntas */}
        {user?.role !== "TAREFEIRO" || showQuestions ? (
          loadingQuestions ? (
            <ActivityIndicator size="large" color="#047857" style={{ marginTop: 30 }} />
          ) : filteredQuestions.length === 0 ? (
            <Text style={styles.noQuestionsText}>Nenhuma pergunta encontrada.</Text>
          ) : (
            filteredQuestions.map(q => (
              <TouchableOpacity
                key={q.id}
                activeOpacity={0.9}
                style={styles.postCard}
                onPress={() => router.replace({ pathname: "/(tabs)/[questionId]", params: { questionId: q.id } })}
              >
                <View style={styles.postHeader}>
                  {/* Avatar na pergunta */}
                  <UserAvatar avatarUrl={q.user.avatarUrl} name={q.user.name} size={40} />
                  <Text style={styles.authorName}>{q.user.name}</Text>
                </View>

                <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                  {getTimeAgo(q.createdAt)}
                </Text>

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
          )
        ) : null}

        {/* Anúncios */}
        {user?.role === "TAREFEIRO" && !showQuestions && (
          loadingAds ? (
            <ActivityIndicator size="large" color="rgba(4, 120, 87, 1)" style={{ marginTop: 30 }} />
          ) : sortedAds.length === 0 ? (
            <Text style={styles.noQuestionsText}>Nenhum anúncio encontrado.</Text>
          ) : (
            sortedAds.map((ad, adIdx) => (
              <View key={ad.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  {/* Avatar nos anúncios */}
                  <UserAvatar avatarUrl={ad.user?.avatarUrl} name={ad.user?.name} size={40} />
                  <Text style={styles.authorName}>{ad.user?.name || "Anunciante"}</Text>
                </View>
                <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                  {getTimeAgo(ad.createdAt)}
                </Text>
                <Text style={styles.postText}>{ad.title}</Text>
                {ad.description && <Text style={{ color: "#374151", fontSize: 14, marginBottom: 6 }}>{ad.description}</Text>}

                {/* Carrossel de imagens + zoom */}
                {ad.images && ad.images.length > 0 && (
                  <FlatList
                    data={ad.images}
                    horizontal
                    keyExtractor={(_, i) => i.toString()}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenAdImages(ad.images!, index)}
                      >
                        <Image source={{ uri: getAdImageURL(item.url) }} style={styles.postImage} />
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={{ gap: 10 }}
                  />
                )}

                {/* Minimalist action buttons */}
                <View style={{ flexDirection: "row", marginTop: 12, gap: 16, justifyContent: "flex-end" }}>
                  {/* Botão WhatsApp */}
                  <TouchableOpacity
                    style={styles.iconCircleButton}
                    onPress={() => openWhatsApp(ad.user?.tel)}
                  >
                    <AntDesign name="whats-app" size={24} color="rgba(4, 120, 87, 1)" />
                  </TouchableOpacity>
                  {/* Botão Maps */}
                  <TouchableOpacity
                    style={styles.iconCircleButton}
                    onPress={() => openMaps(ad.localizacao)}
                  >
                    <Feather name="map-pin" size={22} color="rgba(4, 120, 87, 1)" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      <Modal
        isVisible={adModalVisible}
        onBackdropPress={() => setAdModalVisible(false)}
        onBackButtonPress={() => setAdModalVisible(false)}
        style={{ margin: 0 }}
      >
        <ImageViewer
          imageUrls={adModalImages}
          index={adModalIndex}
          enableSwipeDown
          onSwipeDown={() => setAdModalVisible(false)}
          backgroundColor="rgba(0,0,0,0.95)"
          renderIndicator={() => <></>}
          saveToLocalByLongPress={false}
        />
      </Modal>

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
  greeting: { fontSize: 14, color: "#6B7280" },
  username: { fontSize: 18, fontWeight: "700", color: "#111827" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  searchInput: { flex: 1, height: 40, marginLeft: 8, color: "#111827" },
  postCard: { backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 10, borderRadius: 18, padding: 14 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  authorName: { fontWeight: "600", fontSize: 15, color: "#111827" },
  postText: { fontSize: 16, color: "#374151", marginBottom: 10, lineHeight: 22 },
  postImage: { width: width * 0.85, height: 200, borderRadius: 12, backgroundColor: "#E5E7EB" },
  commentButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  commentText: { color: "#047857", fontSize: 14, fontWeight: "600" },
  noQuestionsText: { textAlign: "center", color: "#6B7280", marginTop: 40, fontSize: 16 },
  fab: { position: "absolute", bottom: 90, right: 20, backgroundColor: "#047857", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 6 },
  logoutButton: {
    padding: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#047857",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  iconCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
});