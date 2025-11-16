import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, getCategorySemanticBg, getCategorySemanticColor } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
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

const MAX_MINI_MAP_POSTS = 15;

type MapColorMode = 'light' | 'dark';

function MiniMapMarker({ post, mode }: { post: Post; mode: MapColorMode }) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timeout = setTimeout(() => setTracksViewChanges(false), 300);
    return () => clearTimeout(timeout);
  }, [mode, post.category, post.id]);

  const categoryColor = getCategorySemanticColor(mode, post.category);
  const categoryBg = getCategorySemanticBg(mode, post.category);

  return (
    <Marker
      coordinate={{ latitude: post.latitude, longitude: post.longitude }}
      title={post.title}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={[styles.markerWrapper, { backgroundColor: categoryBg, borderColor: categoryColor }] }>
        <MaterialIcons name={CATEGORY_ICONS[post.category] as any} size={16} color={categoryColor} />
      </View>
    </Marker>
  );
}

function MiniMap({ style, posts }: { style?: any; posts: Post[] }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userLocation, isLoading } = useLocation();
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const mode: MapColorMode = colorScheme === 'dark' ? 'dark' : 'light';

  const postsToRender = useMemo(() => posts.slice(0, MAX_MINI_MAP_POSTS), [posts]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    setInitialRegion((current) => {
      if (current) {
        return current;
      }

      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    });
  }, [userLocation]);

  useEffect(() => {
    if (initialRegion || userLocation || postsToRender.length === 0) {
      return;
    }

    const [firstPost] = postsToRender;
    setInitialRegion({
      latitude: firstPost.latitude,
      longitude: firstPost.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
  }, [initialRegion, postsToRender, userLocation]);

  // Show loading state
  if (isLoading || !initialRegion) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="location-searching" size={32} color={colors.icon} />
      </View>
    );
  }

  return (
    <View style={[style, { position: 'relative' }] }>
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
        {postsToRender.map((post) => (
          <MiniMapMarker key={post.id} post={post} mode={mode} />
        ))}
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
  const mapIconColor = colors.tint;
  const { posts } = usePosts();
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { backgroundColor: colors.background }] }>
        <TouchableOpacity onPress={() => router.push('/map')} accessibilityRole="button" accessibilityLabel="Open map">
          <ThemedText type="subtitle">Map</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/map')}
          accessibilityRole="button"
          accessibilityLabel="Open map"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <MaterialIcons name="map" size={24} color={mapIconColor} />
        </TouchableOpacity>
      </ThemedView>
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={() => router.push('/map')}
        accessibilityRole="button"
        accessibilityLabel="Open full map">
        <MiniMap style={styles.map} posts={posts} />
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
  markerWrapper: {
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

