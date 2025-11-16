import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Feed } from '@/components/feed';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FilterPanel } from '@/components/filter-panel';
import { useFilters } from '@/contexts/filter-context';

export default function ActiveFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const { hasActiveFilters } = useFilters('feed');
  const [filtersVisible, setFiltersVisible] = useState(false);

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
        <ThemedText type="subtitle">Active Feed</ThemedText>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setFiltersVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters">
          <MaterialIcons name="filter-alt" size={24} color={iconColor} />
          {hasActiveFilters && <View style={[styles.activeDot, { backgroundColor: colors.tint }]} />}
        </TouchableOpacity>
      </View>
  <Feed hideHeader showDescription />
  <FilterPanel visible={filtersVisible} onClose={() => setFiltersVisible(false)} scope="feed" />
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
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
