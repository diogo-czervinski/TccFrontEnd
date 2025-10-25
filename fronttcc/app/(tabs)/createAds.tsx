import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
  Modal, Dimensions, StatusBar, // Adicionado StatusBar
  Pressable // Adicionado Pressable
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import api from '@/config/api';
import { useRouter } from 'expo-router';
import { AxiosError } from 'axios';
import { Feather } from '@expo/vector-icons';

export default function CreateAdScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const router = useRouter();

  // --- Seleção de imagens ---
  const handleSelectImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permissão negada', 'Precisamos da galeria.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) setImages(prev => [...prev, ...result.assets]);
  };

  const handleRemoveImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  // --- Localização ---
  const handleGetLocation = async () => {
    setIsCapturingLocation(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setIsCapturingLocation(false);
      return Alert.alert('Permissão negada', 'Precisamos da localização para o anúncio.');
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      await fetchAddress(loc.coords.latitude, loc.coords.longitude);
      setMapModalVisible(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível capturar a localização.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geo.length > 0) setAddress(`${geo[0].city || ''} - ${geo[0].region || ''}`);
    } catch (err) { console.log(err); }
  };

  // --- Publicar (com correção do Android) ---
  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !location)
      return Alert.alert('Campos incompletos', 'Preencha todos os campos e capture a localização.');

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('localizacao', JSON.stringify(location));
      formData.append('address', address);

      images.forEach(img => {
        const fileName = img.fileName; 
        if (!fileName) {
          console.warn('Imagem sem fileName, pulando upload:', img.uri);
          return; 
        }
        const uriParts = fileName.split('.');
        const ext = (uriParts.pop() || '').toLowerCase(); 
        let mimeType = img.type; 

        if (mimeType === 'image' || !mimeType || ext === 'jpg') {
          if (ext === 'jpg' || ext === 'jpeg') {
            mimeType = 'image/jpeg'; 
          } else if (ext === 'png') {
            mimeType = 'image/png';
          } else {
            console.warn('Tipo de imagem desconhecido:', ext);
            return; 
          }
        }
        formData.append('images', {
          uri: img.uri,
          name: fileName,
          type: mimeType, 
        } as any);
      });

      await api.post('/ads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Sucesso!', 'Anúncio publicado.');
      router.back();
    } catch (err) {
      let msg = 'Erro ao publicar.';
      if (err instanceof AxiosError && err.response?.data?.message) msg = err.response.data.message;
      Alert.alert('Erro', msg);
    } finally { setIsLoading(false); }
  };

  const isFormValid = title.trim().length >= 3 && description.trim().length >= 10 && location;

  // --- Modal do mapa (ATUALIZADO PARA TELA CHEIA) ---
  const FreeMapModal = () => {
    if (!location) return null;
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
          var map = L.map('map').setView([${location.latitude}, ${location.longitude}], 16);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }).addTo(map);
          var marker = L.marker([${location.latitude}, ${location.longitude}], { draggable: true }).addTo(map);
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
      // ATUALIZADO: Modal em tela cheia (slide)
      <Modal visible={mapModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalFullScreenContainer}>
          {/* Cabeçalho do Modal */}
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setMapModalVisible(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Ajustar Localização</Text>
            <Pressable onPress={() => setMapModalVisible(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalSaveButtonText}>Confirmar</Text>
            </Pressable>
          </View>

          {/* Conteúdo do Modal */}
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            style={{ flex: 1 }}
            onMessage={e => {
              const data = JSON.parse(e.nativeEvent.data);
              setLocation({ latitude: data.lat || data.latitude, longitude: data.lng || data.longitude });
              fetchAddress(data.lat || data.latitude, data.lng || data.longitude);
            }}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    // ATUALIZADO: Fundo branco
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* ATUALIZADO: Header com padding top */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Anúncio</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Feather name="x" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* ATUALIZADO: Inputs com fundo cinza */}
          <TextInput style={styles.input} placeholder="Título" value={title} onChangeText={setTitle} />
          <TextInput style={[styles.input, styles.descriptionInput]} placeholder="Descrição" multiline value={description} onChangeText={setDescription} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagens</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {images.map((img, i) => (
                <View key={i} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(i)}>
                    <Feather name="x" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            {/* ATUALIZADO: Botão tracejado (igual CreateQuestion) */}
            <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectImages}>
              <Feather name="image" size={24} color="#047857" />
              <Text style={styles.imagePickerButtonText}>Adicionar Imagens</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização</Text>
            {/* ATUALIZADO: Botão de localização com cores do tema */}
            <TouchableOpacity style={[styles.actionButton, location ? styles.actionButtonSuccess : {}]} onPress={handleGetLocation} disabled={isCapturingLocation}>
              {isCapturingLocation ? <ActivityIndicator color={location ? '#fff' : '#047857'} /> :
                <>
                  <Feather name={location ? 'check-circle' : 'map-pin'} size={20} color={location ? '#fff' : '#047857'} />
                  <Text style={[styles.actionButtonText, location ? { color: '#fff' } : {}]}>
                    {location ? 'Localização Capturada!' : 'Capturar Localização'}
                  </Text>
                </>}
            </TouchableOpacity>
            {address ? <Text style={styles.addressText}>{address}</Text> : null}
          </View>

        </ScrollView>

        {/* ATUALIZADO: Footer e Botão Publicar com estilo do tema */}
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.publishButton, !isFormValid && styles.publishButtonDisabled]} onPress={handlePublish} disabled={!isFormValid || isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Publicar</Text>}
          </TouchableOpacity>
        </View>

        <FreeMapModal />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ATUALIZADO: Fundo branco
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  // ATUALIZADO: Header com padding top
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  // ATUALIZADO: Posição do botão de fechar
  closeButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 16,
    padding: 4
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  // ATUALIZADO: Inputs com fundo cinza-claro
  input: {
    fontSize: 16,
    padding: 14,
    backgroundColor: '#F9FAFB', // Fundo cinza claro
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Borda cinza
    marginBottom: 16,
    color: '#111827'
  },
  descriptionInput: { height: 120, textAlignVertical: 'top' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 12 },
  
  // ATUALIZADO: Botão de Localização
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
  // ATUALIZADO: Cor de sucesso do tema
  actionButtonSuccess: {
    backgroundColor: '#047857',
    borderColor: '#047857'
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600', // Mais forte
    color: '#047857', // Verde do tema
    marginLeft: 8
  },
  addressText: {
    marginTop: 8,
    color: '#374151',
    fontSize: 14,
    textAlign: 'center'
  },

  // ADICIONADO: Estilo do botão tracejado (copiado de CreateQuestion)
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1FAE5', // Borda verde clara
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
  },
  imagePickerButtonText: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '600',
    marginLeft: 8,
  },

  // Estilos de preview de imagem (sem mudança)
  imagePreviewContainer: { marginRight: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 3, borderRadius: 8 },
  imagePreview: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#E5E7EB' },
  removeImageButton: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  
  // ATUALIZADO: Footer e Botão de Publicar (copiado de CreateQuestion)
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  publishButton: {
    height: 56,
    backgroundColor: '#047857', // Verde principal
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16, // Mais arredondado
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  publishButtonDisabled: { opacity: 0.5 },
  publishButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  
  modalFullScreenContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  modalHeaderButton: {
    padding: 8,
  },
  modalCancelButtonText: {
    fontSize: 17,
    color: '#047857',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  modalSaveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#047857',
  },
});