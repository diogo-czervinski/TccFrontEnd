import React, { useState, useEffect, useContext } from 'react';
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
  TextInput,
  Alert,
  Keyboard,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/config/api';
import AuthContext from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';

// Avatar componet (igual UserPanel)
function UserAvatar({ avatarUrl, name, size = 32 }: { avatarUrl?: string, name?: string, size?: number }) {
  if (avatarUrl) {
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

interface Comment {
  id: number;
  text: string;
  user: { name: string; id: number; avatarUrl?: string };
}
interface QuestionImage {
  id: number;
  url: string;
}
interface Question {
  id: number;
  text: string;
  user: { name: string; id: number; avatarUrl?: string };
  comments: Comment[];
  images?: QuestionImage[];
}

export default function QuestionDetailScreen() {
  const { questionId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [keyboardHeight] = useState(new Animated.Value(0));

  const getQuestionImageURL = (filename: string) =>
    `${api.defaults.baseURL}/uploads/questions/${filename}`;

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/comment/${questionId}`);
      setQuestion(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da pergunta.');
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [questionId]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePostComment = async () => {
    if (commentText.trim().length === 0) return;
    try {
      await api.post(`/comment/${questionId}`, { text: commentText });
      setCommentText('');
      fetchDetails();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar o comentário.');
    }
  };

  const handleDeleteComment = (idComment: number) => {
    Alert.alert('Excluir comentário', 'Deseja mesmo excluir este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/comment/${idComment}`);
            fetchDetails();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir o comentário.');
          }
        },
      },
    ]);
  };

  const canDeleteComment = (commentUserId: number) => {
    if (!user || !question) return false;
    return commentUserId === user.id || question.user.id === user.id;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home'); 
            }
          }}
        >
          <Feather name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Pergunta</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { flexGrow: 1, paddingBottom: 10 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pergunta */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question?.text}</Text>
          <Text style={styles.questionAuthor}>
            Perguntado por {question?.user?.name || 'Usuário'}
          </Text>

          {/* Imagens */}
          {question?.images && question.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {question.images.map((img) => (
                <TouchableOpacity key={img.id} onPress={() => setZoomImage(getQuestionImageURL(img.url))}>
                  <Image source={{ uri: getQuestionImageURL(img.url) }} style={styles.questionImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <Modal
          isVisible={!!zoomImage}
          onBackdropPress={() => setZoomImage(null)}
          onBackButtonPress={() => setZoomImage(null)}
          style={{ margin: 0 }}
        >
          {zoomImage && (
            <ImageViewer
              imageUrls={[{ url: zoomImage }]}
              enableSwipeDown
              onSwipeDown={() => setZoomImage(null)}
              backgroundColor="rgba(0,0,0,0.95)"
              renderIndicator={() => <></>}
              saveToLocalByLongPress={false}
            />
          )}
        </Modal>

        {/* Comentários */}
        <Text style={styles.commentsTitle}>
          {question?.comments?.length || 0} Resposta
          {question?.comments?.length === 1 ? '' : 's'}
        </Text>

        {question?.comments?.map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <UserAvatar avatarUrl={comment.user?.avatarUrl} name={comment.user?.name} size={32} />
              <Text style={styles.commentAuthor}>{comment.user?.name}</Text>
              {canDeleteComment(comment.user.id) && (
                <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                  <Feather name="trash-2" size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Campo para comentar */}
      <Animated.View style={[styles.footer, { marginBottom: Animated.add(keyboardHeight, insets.bottom) }]}>
        <TextInput
          style={styles.input}
          placeholder="Escreva sua resposta..."
          placeholderTextColor="#9CA3AF"
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handlePostComment}>
          <Feather name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scrollContainer: {
    paddingHorizontal: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 2,
  },
  backButton: {
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#065F46' },

  questionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  questionText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  questionAuthor: { fontSize: 14, color: '#6B7280', marginTop: 10 },
  questionImage: { width: 150, height: 150, borderRadius: 10, marginRight: 10 },

  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    elevation: 1,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  commentAuthor: { fontSize: 14, fontWeight: 'bold', color: '#111827', flex: 1 },
  commentText: { fontSize: 15, color: '#374151' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 45,
    backgroundColor: '#e0e0e0ff',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#059669',
    borderRadius: 22,
    padding: 10,
    marginLeft: 10,
  },
});