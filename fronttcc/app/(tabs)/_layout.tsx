import { Stack, Tabs } from 'expo-router';
import React from 'react';


import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="createQuestion" />
      <Stack.Screen name="EditProfile" />
    </Stack>
  );
}
