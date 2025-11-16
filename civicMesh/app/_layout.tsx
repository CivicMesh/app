import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { PostsProvider } from '@/contexts/posts-context';
import { FilterProvider } from '@/contexts/filter-context';
import { LocationProvider } from '@/contexts/location-context';
import { AppThemeProvider } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup && !inTabsGroup) {
      // Redirect to login if not authenticated and not on auth pages
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      // Redirect to home if authenticated and trying to access the login page
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router, segments]);

  return null;
}

function Providers() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <PostsProvider>
        <FilterProvider>
          <LocationProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <RootLayoutNav />
              <Stack>
                <Stack.Screen name="login" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                <Stack.Screen name="signup" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="post-for-help" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="map" options={{ headerShown: false }} />
                <Stack.Screen name="active-feed" options={{ headerShown: false }} />
                <Stack.Screen name="post-detail" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </ThemeProvider>
          </LocationProvider>
        </FilterProvider>
      </PostsProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <Providers />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
