import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '@/config/api';
import { useRouter } from 'expo-router';
import { AxiosError } from 'axios';
import { Feather } from '@expo/vector-icons'; // Ícones

export default function CreateAdScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false); // Loading para a localização
  const router = useRouter();

  // --- Funções de Imagem ---
  const handleSelectImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Função de Localização ---
  const handleGetLocation = async () => {
    setIsCapturingLocation(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da sua localização para o anúncio.');
      setIsCapturingLocation(false);
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (error) {
      Alert.alert('Erro de Localização', 'Não foi possível obter sua localização. Verifique se o GPS está ativo.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  // --- Função de Publicação ---
  const handlePublish = async () => {
    if (title.trim().length < 3 || description.trim().length < 10 || !location) {
        Alert.alert('Campos incompletos', 'Por favor, preencha o título, a descrição e capture a localização.');
        return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('localizacao', JSON.stringify(location));

      images.forEach((img) => {
        const uriParts = img.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('images', {
          uri: img.uri,
          name: img.fileName || `photo.${fileType}`,
          type: img.mimeType || `image/${fileType}`,
        } as any);
      });

      await api.post('/ads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Sucesso!', 'O seu anúncio foi publicado.');
      router.back();
    } catch (error) {
      let errorMessage = 'Não foi possível publicar o anúncio.';
      if (error instanceof AxiosError && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = title.trim().length >= 3 && description.trim().length >= 10 && location;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Anúncio</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Feather name="x" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.input}
            placeholder="Título do anúncio"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Descrição detalhada do produto ou serviço"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* --- Seção de Imagens --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagens</Text>
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScrollView}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                    <TouchableOpacity onPress={() => handleRemoveImage(index)} style={styles.removeImageButton}>
                      <Feather name="x" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleSelectImages}>
              <Feather name="image" size={20} color="#059669" />
              <Text style={styles.actionButtonText}>Adicionar Imagens</Text>
            </TouchableOpacity>
          </View>

          {/* --- Seção de Localização --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização</Text>
            <TouchableOpacity
              style={[styles.actionButton, location ? styles.actionButtonSuccess : {}]}
              onPress={handleGetLocation}
              disabled={isCapturingLocation}
            >
              {isCapturingLocation ? (
                <ActivityIndicator color={location ? '#FFFFFF' : '#059669'} />
              ) : (
                <>
                  <Feather name={location ? 'check-circle' : 'map-pin'} size={20} color={location ? '#FFFFFF' : '#059669'} />
                  <Text style={[styles.actionButtonText, location ? { color: '#FFFFFF' } : {}]}>
                    {location ? 'Localização Capturada!' : 'Capturar Localização Atual'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.publishButton, !isFormValid && styles.publishButtonDisabled]}
            onPress={handlePublish}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Publicar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  closeButton: { position: 'absolute', right: 16, padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  input: {
    fontSize: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
    color: '#111827',
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonSuccess: {
    backgroundColor: '#10B981', // Verde para sucesso
    borderColor: '#059669',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 8,
  },
  imagePreviewScrollView: {
    marginBottom: 12,
  },
  imagePreviewContainer: {
    marginRight: 10,
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  publishButton: {
    height: 56,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});