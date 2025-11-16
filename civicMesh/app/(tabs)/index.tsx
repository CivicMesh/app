import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themed-view';
import { HomeHeader } from '@/components/home-header';
import { ResourceMapper } from '@/components/resource-mapper';
import { Feed } from '@/components/feed';
import { MenuDrawer } from '@/components/menu-drawer';
import { useAuth } from '@/contexts/auth-context';
import { FilterPanel } from '@/components/filter-panel';
import { useFilters } from '@/contexts/filter-context';

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const { logout, user } = useAuth();
  const { hasActiveFilters } = useFilters('feed');
  const router = useRouter();

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleFilterPress = () => {
    setFiltersVisible(true);
  };

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
      <HomeHeader onMenuPress={handleMenuPress} onFilterPress={handleFilterPress} hasActiveFilters={hasActiveFilters} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ResourceMapper />
        <Feed />
      </ScrollView>
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSignOut={handleSignOut}
        userEmail={user?.email}
        userName={userName}
      />
  <FilterPanel visible={filtersVisible} onClose={() => setFiltersVisible(false)} scope="feed" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
});
