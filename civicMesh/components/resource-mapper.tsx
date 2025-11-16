import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { useLocation } from '@/contexts/location-context';

function MiniMap({ style }: { style?: any }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userLocation, isLoading } = useLocation();
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (userLocation && !initialRegion) {
      setInitialRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [userLocation, initialRegion]);

  // Show loading state
  if (isLoading || !initialRegion) {
    return (
      <View style={[style, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="location-searching" size={32} color={colors.icon} />
      </View>
    );
  }

  return (
    <View style={[style, { backgroundColor: colors.surface, position: 'relative' }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={true}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="blue"
          />
        )}
      </MapView>
      {/* Dynamic Layer Overlay (always on, sits above map) */}
      <View pointerEvents="none" style={styles.dynamicLayer} />
    </View>
  );
}

export function ResourceMapper() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderMuted }] }>
      <ThemedView style={[styles.header, { borderBottomColor: colors.borderMuted }] }>
        <TouchableOpacity onPress={() => router.push('/map')} accessibilityRole="button" accessibilityLabel="Open map">
          <ThemedText type="subtitle">Map</ThemedText>
        </TouchableOpacity>
        <MaterialIcons name="map" size={24} color={colors.brand.accent} />
      </ThemedView>
      <TouchableOpacity
        style={[styles.mapContainer, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}
        onPress={() => router.push('/map')}
        accessibilityRole="button"
        accessibilityLabel="Open full map">
        <MiniMap style={styles.map} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
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

