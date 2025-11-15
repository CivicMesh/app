import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Placeholder Map Component - Replace with actual map library (react-native-maps or expo-maps)
function MapView({ style }: { style?: any }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[style, { backgroundColor: colors.background, position: 'relative' }]}>
      {loading ? (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={{ marginTop: 8 }}>Loading map...</ThemedText>
        </View>
      ) : (
        <>
          {/* Placeholder map background */}
          <View style={[styles.mapPlaceholder, { backgroundColor: '#e0e0e0' }]}>
            <MaterialIcons name="map" size={48} color="#999" />
            <ThemedText style={styles.mapPlaceholderText}>Live Map View</ThemedText>
            <ThemedText style={styles.mapPlaceholderSubtext}>
              Install react-native-maps or expo-maps to display actual map
            </ThemedText>
          </View>
          {/* Dynamic Layer Overlay */}
          <View style={styles.dynamicLayer}>
            <View style={[styles.layerIndicator, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.layerText}>Dynamic Layer Active</ThemedText>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export function ResourceMapper() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Resource Mapper</ThemedText>
        <MaterialIcons name="map" size={24} color={Colors[useColorScheme() ?? 'light'].tint} />
      </ThemedView>
      <View style={styles.mapContainer}>
        <MapView style={styles.map} />
      </View>
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
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  mapPlaceholderSubtext: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dynamicLayer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  layerIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  layerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

