import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useLocation } from '@/contexts/location-context';

function FullMap() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userLocation: cachedLocation, isLoading: locationLoading } = useLocation();
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    // Use cached location immediately if available
    if (cachedLocation && !initialRegion) {
      setUserLocation(cachedLocation);
      setInitialRegion({
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [cachedLocation, initialRegion]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      if (!cachedLocation) return; // Wait for cached location first

      // Watch location updates for live tracking
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when user moves 10 meters
        },
        (newLocation) => {
          setUserLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [cachedLocation]);

  // Show loading only if no cached location
  if (!initialRegion || locationLoading) {
    return (
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <MaterialIcons name="location-searching" size={48} color={colors.icon} />
        <ThemedText style={{ marginTop: 16 }}>Loading map...</ThemedText>
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {userLocation && (
        <Marker
          coordinate={userLocation}
          title="You are here"
          pinColor="blue"
        />
      )}
    </MapView>
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
