import { useState, useCallback } from 'react';
import { StyleSheet, View, BackHandler, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themed-view';
import { HomeHeader } from '@/components/home-header';
import { MenuDrawer } from '@/components/menu-drawer';
import { useAuth } from '@/contexts/auth-context';
import { ThemedText } from '@/components/themed-text';

const LOGO_SOURCE = require('../../assets/images/icon.png');

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

  const welcomeText = userName ? `Welcome, ${userName}!` : 'Welcome to Civic Mesh!';

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
      <HomeHeader onMenuPress={handleMenuPress} />
      <View style={styles.hero}>
        <View style={styles.logoWrapper}>
          <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
        </View>
        <ThemedText type="title" style={styles.brandName}>Civic Mesh</ThemedText>
        <ThemedText style={styles.welcomeText}>{welcomeText}</ThemedText>
      </View>
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
  hero: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  welcomeText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.85,
  },
});
