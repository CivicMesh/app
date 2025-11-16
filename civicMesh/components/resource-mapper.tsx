import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';

function MiniMap({ style }: { style?: any }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [region] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  return (
    <View style={[style, { backgroundColor: colors.background, position: 'relative' }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        rotateEnabled={false}
        pitchEnabled={false}
      />
      {/* Dynamic Layer Overlay (always on, sits above map) */}
      <View pointerEvents="none" style={styles.dynamicLayer} />
    </View>
  );
}

export function ResourceMapper() {
  const router = useRouter();
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/map')} accessibilityRole="button" accessibilityLabel="Open map">
          <ThemedText type="subtitle">Map</ThemedText>
        </TouchableOpacity>
        <MaterialIcons name="map" size={24} color={Colors[useColorScheme() ?? 'light'].tint} />
      </ThemedView>
      <TouchableOpacity style={styles.mapContainer} onPress={() => router.push('/map')} accessibilityRole="button" accessibilityLabel="Open full map">
        <MiniMap style={styles.map} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  dynamicLayer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
});

