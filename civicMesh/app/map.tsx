import { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';

function FullMap() {
  const [region] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
    />
  );
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  // Hardware back should go to home
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        router.replace('/(tabs)');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [router])
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: borderColor }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.replace('/(tabs)')} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Map</ThemedText>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.mapFullContainer}>
        <FullMap />
        {/* Dynamic Layer Overlay (always on, sits above map) */}
        <View pointerEvents="none" style={styles.dynamicLayer} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  mapFullContainer: {
    flex: 1,
    position: 'relative',
  },
  
  dynamicLayer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
});
