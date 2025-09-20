import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
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
