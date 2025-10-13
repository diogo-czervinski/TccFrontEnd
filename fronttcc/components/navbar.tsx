import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function BottomNavBar() {
    const { user } = useContext(AuthContext);
    const router = useRouter();

    const handleNavigate = (path: Parameters<typeof router.push>[0]) => {
        router.push(path);
    };
    return (
        <View style={styles.container}>
            {/* Home */}
            <TouchableOpacity style={styles.tab} onPress={() => handleNavigate('/(tabs)/home')}>
                <Ionicons name="home-outline" size={24} color="#059669" />
                <Text style={styles.tabText}>Home</Text>
            </TouchableOpacity>

            {/* Condicional */}
            {user?.role === 'TAREFEIRO' && (
                <TouchableOpacity style={styles.tab} onPress={() => handleNavigate('/(tabs)/ads')}>
                    <Ionicons name="megaphone-outline" size={24} color="#059669" />
                    <Text style={styles.tabText}>Anúncios</Text>
                </TouchableOpacity>
            )}

            {user?.role === 'PRODUTOR' && (
                <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)/my-ads')}>
                    <Ionicons name="pricetag-outline" size={24} color="#059669" />
                    <Text style={styles.tabText}>Meus Anúncios</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 70,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Evita sobreposição no iPhone
        elevation: 8,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        color: '#059669',
    },
});
