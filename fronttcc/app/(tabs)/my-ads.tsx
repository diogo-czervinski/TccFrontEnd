import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AuthContext from '@/contexts/AuthContext';
import api from '@/config/api';
import { useFocusEffect } from '@react-navigation/native';
import BottomNavBar from '@/components/navbar';
import { useRouter } from 'expo-router';
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

const { width } = Dimensions.get('window');

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

  const getImageUrl = (filename: string) => {
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
            <View key={a.id} style={styles.anuncioCard}>
              {a.images && a.images.length > 0 ? (
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
                    parallaxScrollingOffset: 50,
                  }}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: getImageUrl(item.url) }}
                      style={styles.anuncioImage}
                      resizeMode="cover"
                    />
                  )}
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
            </View>
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
    marginHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    minHeight: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  anuncioImage: {
    width: width -100,
    height: 400,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  placeholderImage: {
    backgroundColor: '#E5E7EB',
  },
  anuncioTextContainer: {
    width: '100%',
    paddingHorizontal: 12,  
    marginTop: 8,         
  },
  anuncioTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize: 30, color: 'white' },
});
