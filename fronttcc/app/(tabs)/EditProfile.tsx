import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Image, StatusBar, ActivityIndicator, TextInput, Modal, Pressable,
  KeyboardAvoidingView, Platform, Dimensions, Alert
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import AuthContext from '@/contexts/AuthContext';
import api from '@/config/api';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const cardContentWidth = width - 60;

// Avatar component (from HomeScreen)
function UserAvatar({ avatarUrl, name, size = 55 }: { avatarUrl?: string, name?: string, size?: number }) {
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

// ### CORREÇÃO 1: Interface SelectedImage atualizada ###
interface SelectedImage {
  uri: string;
  fileName: string | null;
  type: string | null;
  assetId?: string | null; // Permite 'null'
}

interface AdImage { id: number; url: string; }
interface Anuncio { id: number; title: string; description: string; images: AdImage[]; createdAt: string; localizacao: { latitude: number; longitude: number; }; address: string; }
interface Question { id: number; text: string; images?: { url: string }[]; createdAt: string; }

export default function UserPanel() {
  const { user, reloadUser } = useContext(AuthContext);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'ads' | 'questions'>('ads');
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // --- State do Modal de Perfil ---
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- State do Modal de Edição de Anúncio ---
  const [editAdModalVisible, setEditAdModalVisible] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Anuncio | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImages, setEditImages] = useState<(AdImage | SelectedImage)[]>([]);
  const [newImagesToAdd, setNewImagesToAdd] = useState<SelectedImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [editLocation, setEditLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [isSavingAd, setIsSavingAd] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d atrás`;
    if (diff < 31104000) return `${Math.floor(diff / 2592000)} meses atrás`;
    return `${Math.floor(diff / 31104000)} anos atrás`;
  };

  const fetchAds = async () => {
    setLoadingAds(true);
    try {
      const res = await api.get('/ads/me');
      const sorted = res.data.sort(
        (a: Anuncio, b: Anuncio) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAnuncios(sorted);
    } catch (e) { console.log(e); } finally { setLoadingAds(false); }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/questions/me');
      const sorted = res.data.sort(
        (q1: Question, q2: Question) => new Date(q2.createdAt).getTime() - new Date(q1.createdAt).getTime()
      );
      setQuestions(sorted);
    } catch (e) { console.log(e); } finally { setLoadingQuestions(false); }
  };

  useEffect(() => {
    if (user?.role === 'TAREFEIRO') {
      setActiveTab('questions');
      fetchQuestions();
    } else {
      if (activeTab === 'ads') fetchAds();
      else fetchQuestions();
    }
  }, [activeTab, user?.role]);

  const getAdImageUrl = (filename: string) => `${api.defaults.baseURL}/uploads/ads/${filename}`;
  const getQuestionImageUrl = (filename: string) => `${api.defaults.baseURL}/uploads/questions/${filename}`;

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/user', { name, email, tel });
      await reloadUser();
      setModalVisible(false);
    } catch (e) { 
      console.log(e);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    } finally { 
      setIsSaving(false); 
    }
  };

  const openProfileModal = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setTel(user?.tel || '');
    setModalVisible(true);
  };

  const openEditAdModal = (ad: Anuncio) => {
    setSelectedAd(ad);
    setEditTitle(ad.title);
    setEditDescription(ad.description);
    setEditImages(ad.images);
    setNewImagesToAdd([]);
    setImagesToDelete([]);
    setEditLocation(ad.localizacao);
    setEditAddress(ad.address);
    setEditAdModalVisible(true);
  };

  const handleGetLocationForEdit = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permissão negada', 'Precisamos da localização para o anúncio.');
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setEditLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      await fetchAddressForEdit(loc.coords.latitude, loc.coords.longitude);
      setMapModalVisible(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível capturar a localização.');
    }
  };

  const fetchAddressForEdit = async (lat: number, lon: number) => {
    try {
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geo.length > 0) setEditAddress(`${geo[0].city || ''} - ${geo[0].region || ''}`);
    } catch (err) { console.log(err); }
  };

  const handleSelectImagesForEdit = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permissão negada', 'Precisamos da galeria.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      // Garantindo que os tipos estejam corretos
      const newSelectedImages: SelectedImage[] = result.assets.map(asset => ({
        uri: asset.uri,
        fileName: asset.fileName || 'unknown.jpg', 
        type: asset.mimeType || 'image/jpeg',     
        assetId: asset.assetId,
      }));
      setNewImagesToAdd(prev => [...prev, ...newSelectedImages]);
      setEditImages(prev => [...prev, ...newSelectedImages]);
    }
  };

  // ### CORREÇÃO 2: Lógica de remoção simplificada ###
  const handleRemoveImageFromEdit = (imgToRemove: AdImage | SelectedImage) => {
    if ('id' in imgToRemove) {
      setImagesToDelete(prev => [...prev, imgToRemove.id]);
      setEditImages(prev => prev.filter(img => !('id' in img) || img.id !== imgToRemove.id));
    } else {
      setNewImagesToAdd(prev => prev.filter(img => img.assetId !== imgToRemove.assetId));
      setEditImages(prev => prev.filter(img => !('assetId' in img) || img.assetId !== imgToRemove.assetId));
    }
  };

  const handleUpdateAd = async () => {
    if (!selectedAd) return;
    if (editTitle.trim().length < 3 || editDescription.trim().length < 10) {
      Alert.alert("Campos inválidos", "O título e a descrição são obrigatórios.");
      return;
    }
    if (!editLocation) {
        Alert.alert("Localização ausente", "Por favor, defina a localização do anúncio.");
        return;
    }
    
    setIsSavingAd(true);
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('localizacao', JSON.stringify(editLocation));
      formData.append('address', editAddress);

      imagesToDelete.forEach(imgId => {
        formData.append('imagesToDelete[]', String(imgId));
      });

      newImagesToAdd.forEach(img => {
        const fileName = img.fileName;
        if (!fileName) return;
        
        const uriParts = fileName.split('.');
        const ext = (uriParts.pop() || '').toLowerCase();
        let mimeType = img.type;

        if (mimeType === 'image' || !mimeType || ext === 'jpg') {
          if (ext === 'jpg' || ext === 'jpeg') {
            mimeType = 'image/jpeg';
          } else if (ext === 'png') {
            mimeType = 'image/png';
          } else {
            console.warn('Tipo de imagem desconhecido para upload:', ext);
            return; 
          }
        }
        formData.append('images', {
          uri: img.uri,
          name: fileName,
          type: mimeType,
        } as any);
      });

      await api.patch(`/ads/${selectedAd.id}`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      fetchAds();
      setEditAdModalVisible(false);
      setSelectedAd(null);
      Alert.alert('Sucesso!', 'Anúncio atualizado.');
    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Não foi possível atualizar o anúncio.");
    } finally {
      setIsSavingAd(false);
    }
  };
  
  const handleDeleteAd = (id: number) => {
    Alert.alert("Excluir anúncio", "Tem certeza que deseja excluir este anúncio?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/ads/${id}`);
            setAnuncios(prev => prev.filter(a => a.id !== id));
          } catch (e) { Alert.alert("Erro", "Não foi possível excluir o anúncio."); }
        }
      }
    ]);
  };
  
  const handleEditQuestion = (id: number) => {
    Alert.alert("Editar", "Função de editar pergunta ainda não implementada.");
  };

  const handleDeleteQuestion = (id: number) => {
    Alert.alert("Excluir pergunta", "Tem certeza que deseja excluir esta pergunta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/questions/${id}`);
            setQuestions(prev => prev.filter(q => q.id !== id));
          } catch (e) { Alert.alert("Erro", "Não foi possível excluir a pergunta."); }
        }
      }
    ]);
  };

  const renderAds = () => {
    if (user?.role === 'TAREFEIRO') return null;
    if (loadingAds) return <ActivityIndicator size="large" color="#047857" style={{ marginTop: 20 }} />;
    if (anuncios.length === 0) return <Text style={styles.noContentText}>Nenhum anúncio publicado</Text>;

    return anuncios.map(a => (
      <View key={a.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{a.title}</Text>
          <Text style={styles.cardDate}>{timeAgo(a.createdAt)}</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openEditAdModal(a)}>
              <Feather name="edit-2" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteAd(a.id)}>
              <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardDescription}>{a.description}</Text>
        {a.images.length > 0 ? (
          <Carousel
            loop
            width={cardContentWidth}
            height={200}
            data={a.images}
            autoPlay={false}
            renderItem={({ item }) => (
              <Image source={{ uri: getAdImageUrl(item.url) }} style={styles.cardImage} resizeMode="cover" />
            )}
            style={{ marginBottom: 0 }}
          />
        ) : <View style={{ height: a.description ? 10 : 0 }} />}
      </View>
    ));
  };

  const renderQuestions = () => {
    if (loadingQuestions) return <ActivityIndicator size="large" color="#047857" style={{ marginTop: 20 }} />;
    if (questions.length === 0) return <Text style={styles.noContentText}>Nenhuma pergunta publicada</Text>;

    return questions.map(q => (
      <View key={q.id} style={styles.card}>
        <View style={styles.cardHeader}>
          {/* Avatar do usuário logado */}
          <UserAvatar avatarUrl={user?.avatarUrl} name={user?.name} size={40} />
          <Text style={styles.cardTitle}>{q.text}</Text>
          <Text style={styles.cardDate}>{timeAgo(q.createdAt)}</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleEditQuestion(q.id)}>
              <Feather name="edit-2" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteQuestion(q.id)}>
              <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        {q.images && q.images.length > 0 && (
          <Carousel
            loop
            width={cardContentWidth}
            height={200}
            data={q.images}
            autoPlay={false}
            renderItem={({ item }) => (
              <Image source={{ uri: getQuestionImageUrl(item.url) }} style={styles.cardImage} resizeMode="cover" />
            )}
            style={{ marginBottom: 10 }}
          />
        )}
        <TouchableOpacity 
          style={styles.commentButton}
          onPress={() => router.replace({ pathname: '/(tabs)/[questionId]', params: { questionId: q.id }})}
        >
          <Feather name="message-circle" size={18} color="#047857" />
          <Text style={styles.commentText}>Ver e comentar</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  const renderProfileModal = () => (
    <Modal visible={modalVisible} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Editar Perfil</Text>
            <Pressable onPress={handleUpdateProfile} disabled={isSaving} style={styles.modalHeaderButton}>
              <Text style={[styles.modalSaveButtonText, isSaving && { color: '#6B7280' }]}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            {/* Avatar do usuário logado */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <UserAvatar avatarUrl={user?.avatarUrl} name={user?.name} size={70} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput style={styles.input} placeholder="Seu nome completo" value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.input} placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput style={styles.input} placeholder="(XX) XXXXX-XXXX" value={tel} onChangeText={setTel} keyboardType="phone-pad" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  const renderEditAdModal = () => (
    <Modal visible={editAdModalVisible} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditAdModalVisible(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Editar Anúncio</Text>
            <Pressable onPress={handleUpdateAd} disabled={isSavingAd} style={styles.modalHeaderButton}>
              <Text style={[styles.modalSaveButtonText, isSavingAd && { color: '#6B7280' }]}>
                {isSavingAd ? 'Salvando...' : 'Salvar'}
              </Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Título do anúncio" 
                value={editTitle} 
                onChangeText={setEditTitle} 
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput 
                style={[styles.input, styles.multilineInput]}
                placeholder="Descrição detalhada" 
                value={editDescription} 
                onChangeText={setEditDescription} 
                multiline
                numberOfLines={5}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Imagens</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {editImages.map((img, i) => (
                  <View key={ 'id' in img ? `existing-${img.id}` : `new-${img.assetId}-${i}` } style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: 'id' in img ? getAdImageUrl(img.url) : img.uri }} 
                      style={styles.imagePreview} 
                    />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImageFromEdit(img)}>
                      <Feather name="x" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectImagesForEdit}>
                <Feather name="image" size={24} color="#047857" />
                <Text style={styles.imagePickerButtonText}>Adicionar Novas Imagens</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Localização</Text>
                <TouchableOpacity 
                    style={[styles.actionButton, editLocation ? styles.actionButtonSuccess : {}]} 
                    onPress={handleGetLocationForEdit}
                >
                    <Feather name={editLocation ? 'check-circle' : 'map-pin'} size={20} color={editLocation ? '#fff' : '#047857'} />
                    <Text style={[styles.actionButtonText, editLocation ? { color: '#fff' } : {}]}>
                        {editLocation ? 'Localização Definida' : 'Capturar / Alterar Localização'}
                    </Text>
                </TouchableOpacity>
                {editAddress ? <Text style={styles.addressText}>{editAddress}</Text> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {renderMapModal()}
    </Modal>
  );

  const renderMapModal = () => {
    if (!editLocation) return null;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
        <style>html,body,#map{height:100%;margin:0;padding:0}</style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script>
          var map = L.map('map').setView([${editLocation.latitude}, ${editLocation.longitude}], 16);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }).addTo(map);
          var marker = L.marker([${editLocation.latitude}, ${editLocation.longitude}], { draggable: true }).addTo(map);
          marker.on('dragend', e => {
            var pos = marker.getLatLng();
            window.ReactNativeWebView.postMessage(JSON.stringify(pos));
          });
          map.on('click', e => {
            marker.setLatLng(e.latlng);
            window.ReactNativeWebView.postMessage(JSON.stringify(e.latlng));
          });
        </script>
      </body>
      </html>
    `;
    return (
      <Modal visible={mapModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalFullScreenContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setMapModalVisible(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Ajustar Localização</Text>
            <Pressable onPress={() => setMapModalVisible(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalSaveButtonText}>Confirmar</Text>
            </Pressable>
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            style={{ flex: 1 }}
            onMessage={e => {
              const data = JSON.parse(e.nativeEvent.data);
              setEditLocation({ latitude: data.lat || data.latitude, longitude: data.lng || data.longitude });
              fetchAddressForEdit(data.lat || data.latitude, data.lng || data.longitude);
            }}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <View style={styles.headerProfile}>
              {/* Avatar do usuário logado */}
              <UserAvatar avatarUrl={user?.avatarUrl} name={user?.name} size={55} />
              <View>
                <Text style={styles.greeting}>Meu Perfil</Text>
                <Text style={styles.userName}>{user?.name}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={openProfileModal} style={styles.editButton}>
            <Feather name="settings" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {user?.role !== 'TAREFEIRO' && (
            <TouchableOpacity style={[styles.tab, activeTab === 'ads' && styles.activeTab]} onPress={() => setActiveTab('ads')}>
              <Text style={activeTab === 'ads' ? styles.activeTabText : styles.tabText}>Meus Anúncios</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.tab, activeTab === 'questions' && styles.activeTab]} onPress={() => setActiveTab('questions')}>
            <Text style={activeTab === 'questions' ? styles.activeTabText : styles.tabText}>Minhas Perguntas</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'ads' ? renderAds() : renderQuestions()}
      </ScrollView>

      {activeTab === 'ads' && user?.role !== 'TAREFEIRO' && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/(tabs)/createAds')}>
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {renderProfileModal()}
      {renderEditAdModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 40 },
  headerLeftGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { padding: 6 },
  headerProfile: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 55, height: 55, borderRadius: 28, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#065F46" },
  greeting: { fontSize: 14, color: "#6B7280" },
  userName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  editButton: { padding: 4 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, marginTop: 16, marginHorizontal: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 12 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#047857' },
  tabText: { fontSize: 16, color: '#6B7280' },
  activeTabText: { fontSize: 16, fontWeight: '600', color: '#047857' },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 10, borderRadius: 18, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3 },
  cardHeader: { 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8, 
    gap: 8,
    flexWrap: 'wrap' 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827', 
    flex: 1, 
    marginRight: 'auto' 
  },
  cardDate: { 
    fontSize: 12, 
    color: '#9CA3AF', 
    marginRight: 8, 
    fontStyle: 'italic',
  },
  cardDescription: { fontSize: 16, color: "#374151", marginBottom: 10, lineHeight: 22 },
  cardImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#E5E7EB', marginBottom: 10 },
  actionIcons: { flexDirection: 'row', gap: 12 },
  iconButton: { padding: 6 },
  noContentText: { textAlign: 'center', color: '#6B7280', margin: 30, fontSize: 16 },
  commentButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  commentText: { color: "#047857", fontSize: 14, fontWeight: "600" },
  fab: { position: "absolute", bottom: 90, right: 20, backgroundColor: "#047857", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 6 },
  
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalFullScreenContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  modalHeaderButton: { padding: 8 },
  modalCancelButtonText: { fontSize: 17, color: '#047857' },
  modalHeaderTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  modalSaveButtonText: { fontSize: 17, fontWeight: '600', color: '#047857' },
  modalBody: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { fontSize: 16, color: '#111827', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  modalInfoText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 12 },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1FAE5',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
  },
  imagePickerButtonText: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  actionButtonSuccess: {
    backgroundColor: '#047857',
    borderColor: '#047857'
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginLeft: 8
  },
  addressText: {
    marginTop: 8,
    color: '#374151',
    fontSize: 14,
    textAlign: 'center'
  },
  
  imagePreviewContainer: { 
    marginRight: 10, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 3, 
    elevation: 3, 
    borderRadius: 8 
  },
  imagePreview: { 
    width: 90, 
    height: 90, 
    borderRadius: 8, 
    backgroundColor: '#E5E7EB' 
  },
  removeImageButton: { 
    position: 'absolute', 
    top: 4, 
    right: 4, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 12, 
    width: 24, 
    height: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});