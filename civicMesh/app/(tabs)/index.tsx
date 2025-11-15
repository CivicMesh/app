import { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { HomeHeader } from '@/components/home-header';
import { ResourceMapper } from '@/components/resource-mapper';
import { Feed } from '@/components/feed';
import { MenuDrawer } from '@/components/menu-drawer';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleSignOut = async () => {
    setMenuVisible(false);
    await logout();
    router.replace('/login');
  };

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.name || undefined;

  return (
    <ThemedView style={styles.container}>
      <HomeHeader onMenuPress={handleMenuPress} />
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
