import { StyleSheet, View, TouchableOpacity } from 'react-native';
import type { ColorValue } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { usePosts } from '@/contexts/posts-context';

/**
 * Web fallback placeholder for the mini map component.
 * react-native-maps is native-only, so we render a friendly notice instead.
 */
export function ResourceMapper() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = ('card' in colors ? colors.card : colors.background) as ColorValue;
  const { posts } = usePosts();
  const postCount = posts.length;

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
          <MaterialIcons name="map" size={24} color={colors.tint} />
        </TouchableOpacity>
      </ThemedView>
      <TouchableOpacity
        style={[styles.placeholderContainer, { borderColor: colors.border, backgroundColor }]}
        onPress={() => router.push('/map')}
        accessibilityRole="button"
        accessibilityLabel="Open full map"
        accessibilityHint="Opens the list view tailored for web"
        activeOpacity={0.85}>
        <MaterialIcons name="fullscreen" size={32} color={colors.tint} />
        <ThemedText style={styles.placeholderTitle}>Map preview unavailable on web</ThemedText>
        <ThemedText style={styles.placeholderBody}>
          Use a mobile device for the interactive map experience. On the web, you can browse posts in the map view list.
        </ThemedText>
        <ThemedText style={styles.placeholderMeta}>{postCount} active post{postCount === 1 ? '' : 's'} nearby</ThemedText>
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
  placeholderContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    marginTop: 16,
    fontWeight: '600',
  },
  placeholderBody: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  placeholderMeta: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.7,
  },
});
