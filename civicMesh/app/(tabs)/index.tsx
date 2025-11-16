import { useState, useCallback } from 'react';
import { StyleSheet, View, BackHandler, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themed-view';
import { HomeHeader } from '@/components/home-header';
import { ResourceMapper } from '@/components/resource-mapper';
import { Feed } from '@/components/feed';
import { MenuDrawer } from '@/components/menu-drawer';
import { useAuth } from '@/contexts/auth-context';
import { usePosts } from '@/contexts/posts-context';
import { useLocation } from '@/contexts/location-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { logout, user } = useAuth();
  const { refreshPosts } = usePosts();
  const { refreshLocation } = useLocation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleRefresh = useCallback(async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    try {
      await Promise.all([refreshPosts(), refreshLocation()]);
    } catch (error) {
      console.error('Error refreshing home data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshLocation, refreshPosts, refreshing]);

  const handleSignOut = async () => {
    setMenuVisible(false);
    await logout();
    router.replace('/login');
  };

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.name || undefined;

  // Hardware back button should exit app without logging out
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        BackHandler.exitApp();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <HomeHeader onMenuPress={handleMenuPress} onRefresh={handleRefresh} isRefreshing={refreshing} />
      <View style={styles.content}>
        <ResourceMapper />
        <Feed />
      </View>
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSignOut={handleSignOut}
        userEmail={user?.email}
        userName={userName}
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => router.push('/post-for-help')}
        accessibilityRole="button"
        accessibilityLabel="Create a post"
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle" size={56} color={colors.tint} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 24,
    borderRadius: 40,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
