import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Image,
  TouchableOpacity, StatusBar, ActivityIndicator,
  TextInput, Alert, Modal, Pressable, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/config/api';
import AuthContext from '@/contexts/AuthContext';
import { AxiosError } from 'axios';

interface Comment { id: number; text: string; user: { name: string, id: number }; }
interface QuestionImage { id: number; url: string; }
interface Question {
  id: number;
  text: string;
  user: { name: string, id: number };
  comments: Comment[];
  images?: QuestionImage[];
}

export default function QuestionDetailScreen() {
  const { questionId } = useLocalSearchParams();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | null>(null);
  const { user } = useContext(AuthContext);


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
    if (Platform.OS === 'web') {
      // Web: confirm tradicional
      const confirmDelete = window.confirm("Tem certeza que deseja excluir este comentário?");
      if (!confirmDelete) return;

      api.delete(`/comment/${idComment}`)
        .then(() => fetchDetails())
        .catch((err) => alert(err.response?.data?.message || "Não foi possível excluir o comentário."));
      return;
    }

    // Mobile (iOS / Android)
    Alert.alert(
      "Excluir comentário",
      "Tem certeza que deseja excluir este comentário?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            api.delete(`/comment/${idComment}`)
              .then(() => fetchDetails())
              .catch((err) => Alert.alert("Erro", err.response?.data?.message || "Não foi possível excluir o comentário."));
          }
        }
      ]
    );
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header com botão de voltar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
              <Text style={styles.backButton}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalhes da Pergunta</Text>
          </View>

          {/* Pergunta */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{question?.text}</Text>
            <Text style={styles.questionAuthor}>
              Perguntado por {question?.user?.name || 'Usuário'}
            </Text>
          </View>

          {/* Imagens */}
          {question?.images && question.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, paddingHorizontal: 16 }}>
              {question.images.map((img) => (
                <TouchableOpacity key={img.id} onPress={() => setZoomImage(getQuestionImageURL(img.url))}>
                  <Image source={{ uri: getQuestionImageURL(img.url) }} style={styles.questionImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Modal Zoom */}
          <Modal visible={!!zoomImage} transparent animationType="fade">
            <Pressable style={styles.zoomContainer} onPress={() => setZoomImage(null)}>
              <Image source={{ uri: zoomImage || '' }} style={styles.zoomImage} resizeMode="contain" />
            </Pressable>
          </Modal>

          {/* Comentários */}
          <Text style={styles.commentsTitle}>
            {question?.comments?.length || 0} Respostas
          </Text>
          {question?.comments?.map((comment) => (
            <View key={comment.id} style={styles.commentContainer}>
              <View style={styles.commentHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <Text style={styles.commentAuthor}>{comment.user?.name || 'Usuário'}</Text>

                {canDeleteComment(comment.user.id) && (
                  <TouchableOpacity

                    onPress={() => handleDeleteComment(comment.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}

        </ScrollView>

        {/* Input Comentário */}
        <View style={styles.footer}>
          <TextInput
            style={styles.input}
            placeholder="Adicione sua resposta..."
            placeholderTextColor="#9CA3AF"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handlePostComment}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backButton: { fontSize: 16, color: '#059669', marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  questionContainer: { backgroundColor: '#FFFFFF', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#111827', lineHeight: 28 },
  questionAuthor: { fontSize: 14, color: '#6B7280', marginTop: 12 },
  questionImage: { width: 150, height: 150, borderRadius: 12, marginRight: 12 },
  zoomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  zoomImage: { width: '90%', height: '90%' },
  commentsTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  commentContainer: { backgroundColor: '#FFFFFF', padding: 16, marginHorizontal: 24, marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarLetter: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  commentAuthor: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  commentText: { fontSize: 16, color: '#4B5563', lineHeight: 24 },

  footer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  input: { flex: 1, height: 48, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 20, marginRight: 12, fontSize: 16 },
  sendButton: { paddingHorizontal: 16 },
  sendButtonText: { color: '#059669', fontSize: 16, fontWeight: 'bold' },

  deleteButton: {
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: 'bold',
  },

});
