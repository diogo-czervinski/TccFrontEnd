// app/(tabs)/home.tsx
import React, { useContext, useState } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../config/api";
import AuthContext from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import BottomNavBar from "@/components/navbar";

const { width } = Dimensions.get("window");

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

export default function HomeScreen() {
  const { user: userFromContext } = useContext(AuthContext);
  const user = userFromContext as User | null;
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
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

  const getQuestionImageURL = (filename: string) =>
    `${api.defaults.baseURL}/uploads/questions/${filename}`;

  const getInitial = (name?: string) =>
    !name ? "?" : name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Olá, {user?.name}!</Text>
            <Text style={styles.headerSubtitle}>Bem-vindo à comunidade</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/EditProfile")}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{getInitial(user?.name)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card para criar pergunta */}
        <View style={styles.createQuestionCard}>
          <TouchableOpacity
            style={styles.createQuestionContent}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/createQuestion")}
          >
            <View style={styles.createAvatar}>
              <Text style={styles.avatarLetter}>{getInitial(user?.name)}</Text>
            </View>
            <Text style={styles.createPlaceholder}>
              Alguma dúvida sobre o cultivo de erva-mate hoje?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageButton}
            onPress={() => router.push("/(tabs)/createQuestion")}
          >
            <Feather name="image" size={20} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Título da seção */}
        <Text style={styles.sectionTitle}>Fórum da Comunidade</Text>

        {/* Lista de perguntas */}
        {loadingQuestions ? (
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />
        ) : questions.length === 0 ? (
          <Text style={styles.noQuestionsText}>Ainda não há perguntas. Seja o primeiro!</Text>
        ) : (
          questions.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.questionCard}
              activeOpacity={0.9}
              onPress={() =>
                router.replace({ pathname: "/(tabs)/[questionId]", params: { questionId: q.id } })
              }
            >
              {/* Cabeçalho: avatar + nome */}
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{getInitial(q.user.name)}</Text>
                </View>
                <Text style={styles.questionAuthor}>{q.user.name}</Text>
              </View>

              {/* Texto da pergunta */}
              <Text style={styles.questionText}>{q.text}</Text>

              {/* Carrossel de imagens */}
              {q.images && q.images.length > 0 && (
                <FlatList
                  data={q.images}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: getQuestionImageURL(item.url) }}
                      style={[styles.carouselImage, { width: width - 60 }]}
                    />
                  )}
                  snapToInterval={width - 50}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
                />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Nav */}
      {user?.role && <BottomNavBar />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 16, color: "#6B7280" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 20, fontWeight: "bold", color: "#374151" },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 24,
    marginBottom: 12,
  },
  noQuestionsText: {
    textAlign: "center",
    color: "#6B7280",
    margin: 20,
    fontSize: 16,
  },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  questionAuthor: { fontWeight: "bold", color: "#111827", fontSize: 16 },
  questionText: { fontSize: 16, color: "#374151", marginBottom: 10 },
  carouselImage: {
    height: 200,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#E5E7EB",
  },

  createQuestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  createQuestionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  createAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  createPlaceholder: {
    fontSize: 16,
    color: "#6B7280",
    flex: 1,
  },
  imageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
});
