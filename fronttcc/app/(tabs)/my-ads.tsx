import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import AuthContext from '@/contexts/AuthContext';
import api from '@/config/api';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import BottomNavBar from '@/components/navbar';
import { AxiosError } from 'axios';

interface AdImage {
  id: number;
  url: string; 
}

interface Anuncio {
  id: number;
  title: string;
  description: string;
  images: AdImage[]; 
}

export default function MyAds() {
  const { user } = useContext(AuthContext);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAnuncios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ads/me');
      setAnuncios(response.data);
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        console.log('Erro ao carregar anúncios:', error.response.data);
      } else {
        console.log('Erro inesperado ao carregar anúncios:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAnuncios();
    }, [])
  );

  // ✅ CORREÇÃO APLICADA AQUI
  const getImageUrl = (filename: string) => {
    // Monta a URL completa adicionando o caminho do servidor onde as imagens estão
    return `${api.defaults.baseURL}/uploads/ads/${filename}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Anúncios</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />
        ) : anuncios.length === 0 ? (
          <Text style={styles.noAnunciosText}>
            Você ainda não publicou nenhum anúncio.
          </Text>
        ) : (
          anuncios.map((a) => (
            <TouchableOpacity key={a.id} style={styles.anuncioCard}>
              {a.images && a.images.length > 0 ? (
                <Image
                  source={{ uri: getImageUrl(a.images[0].url) }}
                  style={styles.anuncioImage}
                />
              ) : (
                <View style={[styles.anuncioImage, styles.placeholderImage]} />
              )}

              <View style={styles.anuncioTextContainer}>
                <Text style={styles.anuncioTitle}>{a.title}</Text>
                <Text style={styles.anuncioDescription} numberOfLines={2}>
                  {a.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(tabs)/createAds')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 24, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  anuncioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  anuncioImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    backgroundColor: '#E5E7EB',
  },
  anuncioTextContainer: {
    flex: 1,
  },
  anuncioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  anuncioDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  noAnunciosText: { textAlign: 'center', color: '#6B7280', margin: 30, fontSize: 16 },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 90,
    backgroundColor: '#059669',
    borderRadius: 30,
    elevation: 8,
  },
  fabText: { fontSize: 30, color: 'white' },
});