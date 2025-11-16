import { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, getCategorySemanticBg, getCategorySemanticColor } from '@/constants/theme';
import { FilterPanel } from '@/components/filter-panel';
import { useFilters } from '@/contexts/filter-context';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useLocation } from '@/contexts/location-context';
import { usePosts } from '@/contexts/posts-context';
import { Post } from '@/services/api';

const CATEGORY_ICONS: Record<Post['category'], string> = {
  alert: 'warning',
  warning: 'error',
  help: 'help',
  resources: 'inventory',
  'accessibility resources': 'accessible',
};

type FullMapProps = {
  posts: Post[];
  onSelectPost: (post: Post) => void;
};

function FullMap({ posts, onSelectPost }: FullMapProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userLocation: cachedLocation, isLoading: locationLoading } = useLocation();
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mode = colorScheme === 'dark' ? 'dark' : 'light';

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
      {posts.map((post) => {
        const categoryColor = getCategorySemanticColor(mode, post.category);
        const categoryBg = getCategorySemanticBg(mode, post.category);
        return (
          <Marker
            key={post.id}
            coordinate={{ latitude: post.latitude, longitude: post.longitude }}
            onPress={() => onSelectPost(post)}
          >
            <View style={[styles.markerWrapper, { backgroundColor: categoryBg, borderColor: categoryColor }] }>
              <MaterialIcons name={CATEGORY_ICONS[post.category] as any} size={18} color={categoryColor} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const { posts } = usePosts();
  const { selectedCategories, selectedSubcategories, hasActiveFilters } = useFilters('map');
  const [filtersVisible, setFiltersVisible] = useState(false);

  const filteredPosts = useMemo(() => {
    const categorySet = new Set(selectedCategories);
    const subcategorySet = new Set(
      Object.values(selectedSubcategories).reduce<string[]>((acc, curr = []) => acc.concat(curr), [])
    );

    const hasCategoryFilters = categorySet.size > 0;
    const hasSubcategoryFilters = subcategorySet.size > 0;

    return posts.filter((post) => {
      const categoryMatch = hasCategoryFilters ? categorySet.has(post.category) : true;
      const subcategoryMatch = hasSubcategoryFilters
        ? (post.subcategory ? subcategorySet.has(post.subcategory) : false)
        : true;
      return categoryMatch && subcategoryMatch;
    });
  }, [posts, selectedCategories, selectedSubcategories]);

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
          <MaterialIcons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Map</ThemedText>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setFiltersVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters">
          <MaterialIcons name="filter-alt" size={24} color={iconColor} />
          {hasActiveFilters && <View style={[styles.activeDot, { backgroundColor: colors.tint }]} />}
        </TouchableOpacity>
      </View>

      <View style={styles.mapFullContainer}>
        <FullMap
          posts={filteredPosts}
          onSelectPost={(post) =>
            router.push({ pathname: '/post-detail', params: { id: post.id, from: 'map' } })
          }
        />
        {/* Dynamic Layer Overlay reserved for future layers */}
        <View pointerEvents="none" style={styles.dynamicLayer} />
      </View>
      <FilterPanel visible={filtersVisible} onClose={() => setFiltersVisible(false)} scope="map" />
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
    position: 'relative',
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
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  markerWrapper: {
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
