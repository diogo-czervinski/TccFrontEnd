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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '@/config/api';
import { useRouter } from 'expo-router';
import { AxiosError } from 'axios';

export default function CreateAdScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<any[]>([]);
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
      setImages(result.assets);
    }
  };

  const handlePublish = async () => {
    if (title.trim().length < 3) {
      Alert.alert('Título muito curto', 'Digite um título válido para o anúncio.');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Descrição muito curta', 'Por favor, detalhe melhor seu anúncio.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      images.forEach((img) => {
        // CORREÇÃO: Usar dados dinâmicos da imagem
        const uriParts = img.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('images', {
          uri: img.uri,
          // MELHORIA: Usa o nome original do arquivo ou gera um
          name: img.fileName || `photo.${fileType}`,
          // CORREÇÃO: Usa o mimeType fornecido pelo image-picker ou deduz pela extensão
          type: img.mimeType || `image/${fileType}`,
        } as any);
      });

      // CORREÇÃO CRÍTICA: Remova o objeto de configuração de headers.
      // O Axios fará isso automaticamente para FormData.
      await api.post('/ads', formData);

      Alert.alert('Sucesso!', 'O seu anúncio foi publicado.');
      router.back(); // Navega de volta após o sucesso
    } catch (error) {
      // MELHORIA: Log de erro detalhado
      let errorMessage = 'Não foi possível publicar o anúncio.';
      if (error instanceof AxiosError && error.response) {
        console.error('Erro do Backend:', error.response.data);
        // Pega uma mensagem mais específica do backend, se houver
        errorMessage = error.response.data.message || errorMessage;
      } else {
        console.error('Erro inesperado:', error);
      }
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Anúncio</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeButton}>Fechar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.input}
            placeholder="Título do anúncio"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { height: 120 }]}
            placeholder="Descrição detalhada do produto ou serviço"
            placeholderTextColor="#9CA3AF"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.selectButton} onPress={handleSelectImages}>
            <Text style={styles.selectButtonText}>Selecionar Imagens</Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <ScrollView horizontal style={{ marginTop: 10 }}>
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img.uri }}
                  style={{ width: 100, height: 100, marginRight: 10, borderRadius: 8 }}
                />
              ))}
            </ScrollView>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handlePublish}>
            <Text style={styles.buttonText}>Publicar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  keyboardContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeButton: { position: 'absolute', right: -120, fontSize: 16, color: '#059669' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  input: { fontSize: 18, textAlignVertical: 'top', color: '#111827', marginBottom: 12 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  button: { height: 56, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  selectButton: { marginTop: 10, padding: 12, backgroundColor: '#E5E7EB', borderRadius: 8, alignItems: 'center' },
  selectButtonText: { fontSize: 16, color: '#111827' },
});
