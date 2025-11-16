import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type HomeHeaderProps = {
  onMenuPress?: () => void;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
};

export function HomeHeader({
  onMenuPress,
  onFilterPress,
  hasActiveFilters,
}: HomeHeaderProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const borderColor = colorScheme === 'dark' ? colors.border : colors.borderMuted;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          backgroundColor: colors.surface,
          borderBottomColor: borderColor,
        },
      ]}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onMenuPress}
        accessibilityLabel="Open menu"
        accessibilityRole="button">
        <MaterialIcons name="menu" size={28} color={colors.icon} />
      </TouchableOpacity>
      <View style={styles.headerSpacer} />
      {onFilterPress ? (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
          accessibilityLabel="Open filters"
          accessibilityRole="button">
          <MaterialIcons name="filter-alt" size={24} color={hasActiveFilters ? colors.tint : colors.icon} />
          {hasActiveFilters && <View style={[styles.filterDot, { backgroundColor: colors.tint }]} />}
        </TouchableOpacity>
      ) : (
        <View style={styles.menuButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

