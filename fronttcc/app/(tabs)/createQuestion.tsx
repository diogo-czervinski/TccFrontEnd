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
import { useRouter } from 'expo-router'; // <- import do router

export default function CreateQuestionScreen() {
  const [text, setText] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const router = useRouter(); // <- useRouter do expo-router

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
    if (text.trim().length < 10) {
      Alert.alert('Pergunta muito curta', 'Por favor, detalhe um pouco mais a sua dúvida.');
      return;
    }

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
      router.back(); // <- substitui navigation.goBack()
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível publicar a sua pergunta.');
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
          <Text style={styles.headerTitle}>Nova Pergunta</Text>
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
            placeholder="Qual é a sua dúvida sobre o cultivo, mercado ou técnicas da erva-mate?"
            placeholderTextColor="#9CA3AF"
            multiline
            value={text}
            onChangeText={setText}
            autoFocus
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
  input: { fontSize: 18, textAlignVertical: 'top', color: '#111827' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  button: { height: 56, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  selectButton: { marginTop: 10, padding: 12, backgroundColor: '#E5E7EB', borderRadius: 8, alignItems: 'center' },
  selectButtonText: { fontSize: 16, color: '#111827' },
});
