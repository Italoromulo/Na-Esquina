import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LocationProvider } from '@/context/LocationContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocationProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="cadastro" options={{ headerShown: false }} />
          <Stack.Screen name="cadastro-vendedor" options={{ headerShown: false }} />
          <Stack.Screen name="conta" options={{ headerShown: false }} />
          <Stack.Screen name="favoritos" options={{ headerShown: false }} />
          <Stack.Screen name="filtros" options={{ headerShown: false }} />
          <Stack.Screen name="membros" options={{ headerShown: false }} />
          <Stack.Screen name="painel-vendedor" options={{ headerShown: false }} />
          <Stack.Screen name="perfil-vendedor" options={{ headerShown: false }} />
          <Stack.Screen name="vendedor/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="rota/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="sacola" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </LocationProvider>
    </ThemeProvider>
  );
}

