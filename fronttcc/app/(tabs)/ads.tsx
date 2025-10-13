import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AuthContext from '../../contexts/AuthContext';
import api from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import BottomNavBar from '../../components/navbar';

interface User {
  id: number;
  name?: string;
  role?: 'PRODUTOR' | 'TAREFEIRO';
  tel?: string;
}

interface AdImage {
  url: string;
}

interface Ad {
  id: number;
  title: string;
  description?: string;
  localizacao?: string;
  user?: User;
  images?: AdImage[];
}

const { width } = Dimensions.get('window');

export default function AdsScreen() {
  const { user } = useContext(AuthContext);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);

  const fetchAds = async () => {
    setLoadingAds(true);
    try {
      const response = await api.get('/ads');
      setAds(response.data);
    } catch (error) {
      console.log('Erro ao carregar anúncios:', error);
    } finally {
      setLoadingAds(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAds();
    }, [])
  );

  const getAdImageURL = (filename: string) =>
    `${api.defaults.baseURL}/uploads/ads/${filename}`;

  const openWhatsApp = (tel?: string) => {
    if (!tel) return;
    const phone = tel.replace(/\D/g, '');
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(err => console.log('Erro ao abrir WhatsApp:', err));
  };

  const openMaps = (localizacao?: string) => {
    if (!localizacao) return;

    try {
      const { latitude, longitude } = JSON.parse(localizacao);
      if (latitude && longitude) {
        // Link universal que funciona tanto em Android quanto iOS
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url).catch(err => console.log('Erro ao abrir o mapa:', err));
      }
    } catch (error) {
      console.log('Erro ao processar a localização para o mapa:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Anúncios</Text>
        </View>

        {loadingAds ? (
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />
        ) : ads.length === 0 ? (
          <Text style={styles.noAdsText}>Nenhum anúncio disponível no momento.</Text>
        ) : (
          ads.map((ad) => (
            <View key={ad.id} style={styles.adCard}>
              {/* Carrossel */}
              {ad.images && ad.images.length > 0 ? (
                <Carousel
                  loop
                  width={width - 40}
                  height={220}
                  autoPlay={false}
                  data={ad.images}
                  scrollAnimationDuration={500}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: getAdImageURL(item.url) }}
                      style={styles.adImage}
                      resizeMode="cover"
                    />
                  )}
                />
              ) : (
                <View style={[styles.adImage, styles.placeholderImage]} />
              )}

              {/* Título e descrição na parte de baixo */}
              <View style={styles.adTextContainer}>
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adDescription} numberOfLines={2}>
                  {ad.description ?? ''}
                </Text>
              </View>

              {/* Ícone de localização flutuante */}
              {ad.localizacao && (
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => openMaps(ad.localizacao)}
                >
                  <FontAwesome name="map-marker" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}

              {/* Ícone de WhatsApp flutuante */}
              {ad.user?.tel && (
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => openWhatsApp(ad.user?.tel)}
                >
                  <FontAwesome name="whatsapp" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {user?.role && <BottomNavBar />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  sectionHeader: { paddingHorizontal: 24, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },

  adCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adImage: {
    width: width - 40,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  placeholderImage: {
    backgroundColor: '#E5E7EB',
  },
  adTextContainer: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 'auto',
  },
  adTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  adDescription: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  locationButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  whatsappButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#25D366',
    padding: 8,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  noAdsText: { textAlign: 'center', color: '#6B7280', marginTop: 30, fontSize: 16 },
});
