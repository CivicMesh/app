import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type HomeHeaderProps = {
  onMenuPress?: () => void;
};

export function HomeHeader({
  onMenuPress,
}: HomeHeaderProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: borderColor }]}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onMenuPress}
        accessibilityLabel="Open menu"
        accessibilityRole="button">
        <MaterialIcons name="menu" size={28} color={colors.icon} />
      </TouchableOpacity>
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
});

