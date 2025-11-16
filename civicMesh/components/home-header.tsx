import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type HomeHeaderProps = {
  onMenuPress?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function HomeHeader({
  onMenuPress,
  onRefresh,
  isRefreshing,
}: HomeHeaderProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const borderColor = colorScheme === 'dark' ? colors.border : colors.borderMuted;
  const iconColor = colors.tint;

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
        style={styles.iconButton}
        onPress={onMenuPress}
        accessibilityLabel="Open menu"
        accessibilityRole="button">
        <Ionicons name="reorder-three" size={28} color={iconColor} />
      </TouchableOpacity>
      <View style={styles.headerSpacer} />
      {onRefresh ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRefresh}
          accessibilityLabel="Refresh content"
          accessibilityRole="button"
          accessibilityState={{ busy: isRefreshing }}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Ionicons name="reload" size={26} color={iconColor} />
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.iconButton, styles.iconPlaceholder]} />
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    flex: 1,
  },
});

