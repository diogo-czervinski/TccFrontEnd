import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, StatusBar,
  ActivityIndicator, Image, Dimensions, TouchableOpacity, Modal, TextInput, Alert,
  Platform
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AuthContext from '@/contexts/AuthContext';
import api from '@/config/api';
import { useFocusEffect } from '@react-navigation/native';
import BottomNavBar from '@/components/navbar';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface AdImage { id: number; url: string; }
interface Anuncio { id: number; title: string; description: string; images: AdImage[]; }
interface Question { id: number; text: string; images?: { url: string }[]; }

export default function UserPanel() {
  const { user, reloadUser } = useContext(AuthContext);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'questions' | 'ads'>('ads');
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [tel, setTel] = useState(user?.tel || '');
  const [isSaving, setIsSaving] = useState(false);

  // --- Fetch anúncios e perguntas ---
  const fetchAds = async () => {
    setLoadingAds(true);
    try {
      const res = await api.get('/ads/me');
      setAnuncios(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAds(false);
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/questions/me');
      setQuestions(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'ads') fetchAds();
      if (activeTab === 'questions') fetchQuestions();
    }, [activeTab])
  );

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/user', { name, email, tel });
      await reloadUser();
      setModalVisible(false);
    } catch (e) {
      console.log(e);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteQuestion = (idQuestion: number) => {
    const confirmMsg = "Tem certeza que deseja excluir esta pergunta?";
    if (Platform.OS === 'web') {
      if (!window.confirm(confirmMsg)) return;
      api.delete(`/questions/${idQuestion}`)
        .then(() => {
          window.alert("Pergunta excluída com sucesso!");
          setQuestions(prev => prev.filter(q => q.id !== idQuestion));
        })
        .catch((err) => {
          window.alert(err.response?.data?.message || "Erro ao excluir pergunta.");
        });
      return;
    }

    Alert.alert("Excluir pergunta", confirmMsg, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive",
        onPress: () => {
          api.delete(`/questions/${idQuestion}`)
            .then(() => {
              Alert.alert("Pergunta excluída com sucesso!");
              setQuestions(prev => prev.filter(q => q.id !== idQuestion));
            })
            .catch((err) => {
              Alert.alert("Erro", err.response?.data?.message || "Erro ao excluir pergunta.");
            });
        }
      }
    ]);
  };

  const handleDeleteAd = (idAd: number) => {
    const confirmMsg = "Tem certeza que deseja excluir este anúncio?";
    if (Platform.OS === 'web') {
      if (!window.confirm(confirmMsg)) return;
      api.delete(`/ads/${idAd}`)
        .then(() => {
          window.alert("Anúncio excluído com sucesso!");
          setAnuncios(prev => prev.filter(a => a.id !== idAd));
        })
        .catch((err) => {
          window.alert(err.response?.data?.message || "Erro ao excluir anúncio.");
        });
      return;
    }

    Alert.alert("Excluir anúncio", confirmMsg, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive",
        onPress: () => {
          api.delete(`/ads/${idAd}`)
            .then(() => {
              Alert.alert("Anúncio excluído com sucesso!");
              setAnuncios(prev => prev.filter(a => a.id !== idAd));
            })
            .catch((err) => {
              Alert.alert("Erro", err.response?.data?.message || "Erro ao excluir anúncio.");
            });
        }
      }
    ]);
  };

  const getAdImageUrl = (filename: string) => `${api.defaults.baseURL}/uploads/ads/${filename}`;
  const getQuestionImageUrl = (filename: string) => `${api.defaults.baseURL}/uploads/questions/${filename}`;
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header / Perfil */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(user?.name || '')}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editButton}>
            <Feather name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('ads')}
            style={[styles.tab, activeTab === 'ads' && styles.activeTab]}
          >
            <Text style={activeTab === 'ads' ? styles.activeTabText : styles.tabText}>
              Meus Anúncios
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('questions')}
            style={[styles.tab, activeTab === 'questions' && styles.activeTab]}
          >
            <Text style={activeTab === 'questions' ? styles.activeTabText : styles.tabText}>
              Minhas Perguntas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botão de Novo Anúncio */}
        {activeTab === 'ads' && (
          <TouchableOpacity
            style={styles.newAdButton}
            onPress={() => router.push('/(tabs)/createAds')}
          >
            <Feather name="plus-circle" size={22} color="#fff" />
            <Text style={styles.newAdButtonText}>Novo Anúncio</Text>
          </TouchableOpacity>
        )}

        {/* Conteúdo */}
        {activeTab === 'ads' ? (
          loadingAds ? (
            <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />
          ) : anuncios.length === 0 ? (
            <Text style={styles.noContentText}>Nenhum anúncio publicado</Text>
          ) : (
            anuncios.map(a => (
              <View key={a.id} style={styles.card}>
                <TouchableOpacity
                  onPress={() => handleDeleteAd(a.id)}
                  style={styles.deleteIcon}
                >
                  <FontAwesome name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>

                {a.images.length > 0 ? (
                  <Carousel
                    loop
                    width={width - 60}
                    height={180}
                    autoPlay={false}
                    data={a.images}
                    scrollAnimationDuration={500}
                    mode="parallax"
                    modeConfig={{
                      parallaxScrollingScale: 0.9,
                      parallaxScrollingOffset: 50
                    }}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: getAdImageUrl(item.url) }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    )}
                  />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage]} />
                )}

                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {a.description}
                  </Text>
                </View>
              </View>
            ))
          )
        ) : (
          loadingQuestions ? (
            <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />
          ) : questions.length === 0 ? (
            <Text style={styles.noContentText}>Nenhuma pergunta publicada</Text>
          ) : (
            questions.map(q => (
              <View key={q.id} style={styles.card}>
                <View style={styles.questionHeader}>
                  <Text style={styles.cardTitle}>{q.text}</Text>
                  <View style={styles.actionIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                      <FontAwesome name="pencil" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteQuestion(q.id)}
                      style={styles.iconButton}
                    >
                      <FontAwesome name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {q.images && q.images.length > 0 && (
                  <Carousel
                    loop
                    width={width - 60}
                    height={180}
                    autoPlay={false}
                    data={q.images}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: getQuestionImageUrl(item.url) }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    )}
                  />
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.commentButton}
                    onPress={() =>
                      router.replace({
                        pathname: '/(tabs)/[questionId]',
                        params: { questionId: q.id }
                      })
                    }
                  >
                    <FontAwesome name="comments" size={16} color="#059669" />
                    <Text style={styles.commentText}>Comentários</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Modal de Perfil */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Editar Perfil</Text>
            <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Telefone" value={tel} onChangeText={setTel} />
            <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
              <Pressable style={styles.saveButton} onPress={handleUpdateProfile} disabled={isSaving}>
                <Text style={{ color: '#fff' }}>{isSaving ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#EF4444' }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', margin: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  userName: { fontSize: 18, fontWeight: '600', marginLeft: 12, flex: 1 },
  editButton: { backgroundColor: '#059669', padding: 8, borderRadius: 12 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  tab: { paddingVertical: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#059669' },
  tabText: { fontSize: 16, color: '#6B7280' },
  activeTabText: { fontSize: 16, fontWeight: '600', color: '#059669' },

  // Novo botão de anúncio
  newAdButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newAdButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },

  card: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  deleteIcon: { position: 'absolute', top: 8, right: 8, padding: 6, zIndex: 10 },
  questionHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionIcons: { flexDirection: 'row', gap: 10 },
  iconButton: { padding: 6 },
  cardImage: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 8 },
  placeholderImage: { backgroundColor: '#E5E7EB' },
  cardTextContainer: { width: '100%', paddingHorizontal: 12, marginTop: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  cardDescription: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  noContentText: { textAlign: 'center', color: '#6B7280', margin: 30, fontSize: 16 },
  cardActions: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  commentButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#E6F4EA' },
  commentText: { marginLeft: 6, color: '#059669', fontWeight: '600', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  input: { fontSize: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff', marginBottom: 12 },
  saveButton: { backgroundColor: '#059669', padding: 12, borderRadius: 12, flex: 1, alignItems: 'center' },
  cancelButton: { borderWidth: 1, borderColor: '#EF4444', padding: 12, borderRadius: 12, flex: 1, alignItems: 'center', marginLeft: 8 },
});
