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
import api from '@/config/api';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; 

export default function CreateQuestionScreen() {
  const [text, setText] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  const handleSelectImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para selecionar imagens.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages(prevImages => [...prevImages, ...result.assets]); 
    }
  };


  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handlePublish = async () => {
    if (text.trim().length < 10) {
      Alert.alert('Pergunta muito curta', 'Por favor, detalhe um pouco mais a sua dúvida.');
      return;
    }
    if (isLoading) return; 

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('text', text);

      images.forEach((img, index) => {
        formData.append('images', {
          uri: img.uri,
          name: `image-${index}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      await api.post('/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Sucesso!', 'A sua pergunta foi publicada na comunidade.');
      setText('');
      setImages([]);
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível publicar a sua pergunta.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100} // Ajuste fino se necessário
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nova Pergunta</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Feather name="x" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>


        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.input}
            placeholder="Qual é a sua dúvida sobre o cultivo, mercado ou técnicas da erva-mate?"
            placeholderTextColor="#9CA3AF"
            multiline
            value={text}
            onChangeText={setText}
            autoFocus
          />


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

  
          <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectImages}>
            <Feather name="image" size={24} color="#059669" />
            <Text style={styles.imagePickerButtonText}>Adicionar Imagens</Text>
          </TouchableOpacity>

        </ScrollView>


        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.publishButton, isLoading && styles.publishButtonDisabled]}
            onPress={handlePublish}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    position: 'absolute', 
    right: 16,
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, 
  },
  input: {
    fontSize: 18,
    textAlignVertical: 'top',
    color: '#111827',
    minHeight: 150, 
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
  },
  imagePickerButtonText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreviewScrollView: {
    marginBottom: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
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
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  publishButton: {
    height: 56,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,

    elevation: 8,
  },
  publishButtonDisabled: {
    backgroundColor: '#047857',
    opacity: 0.8,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});