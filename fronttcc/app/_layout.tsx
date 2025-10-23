import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContext, useEffect } from 'react';
import AuthContext from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import * as Font from 'expo-font';
import { FontAwesome } from '@expo/vector-icons';



export default function RootLayout() {
    useEffect(() => {
        Font.loadAsync(FontAwesome.font);
    }, []);
    
    const colorScheme = useColorScheme();
    const { user } = useContext(AuthContext);

    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="login" />
                        <Stack.Screen name="register" />
                    </>
                ) : (
                    <Stack.Screen name="(tabs)" />
                )}
            </Stack>
            <StatusBar style="auto" />
        </AuthProvider>
    );
}
