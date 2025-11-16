import { StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/contexts/theme-context';

type MenuDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
  userEmail?: string;
  userName?: string;
};

export function MenuDrawer({ visible, onClose, onSignOut, userEmail, userName }: MenuDrawerProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const { colorScheme: appTheme, setTheme } = useThemePreference();
  const isDarkMode = appTheme === 'dark';
  const interactiveIconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const switchActiveTrack = '#000000';
  const switchThumbColor = isDarkMode ? '#FFFFFF' : '#000000';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <ThemedView
              style={[
                styles.drawer,
                {
                  backgroundColor: colors.elevation2,
                  borderColor: colors.border,
                  paddingTop: insets.top + 20,
                  paddingBottom: insets.bottom + 20,
                  shadowColor: colorScheme === 'dark' ? '#000' : '#000',
                },
              ]}>
              {/* Header */}
              <View style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>
                  Menu
                </ThemedText>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              {/* User Info */}
              {(userName || userEmail) && (
                <View
                  style={[
                    styles.userInfo,
                    { borderBottomColor: colorScheme === 'dark' ? colors.border : colors.borderMuted },
                  ]}>
                  {userName && (
                    <ThemedText type="defaultSemiBold" style={styles.userName}>
                      {userName}
                    </ThemedText>
                  )}
                  {userEmail && (
                    <ThemedText style={styles.userEmail}>{userEmail}</ThemedText>
                  )}
                </View>
              )}

              {/* Menu Items */}
              <View style={styles.menuItems}>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colorScheme === 'dark' ? colors.border : colors.borderMuted }]}
                  onPress={onSignOut}
                  activeOpacity={0.7}>
                  <MaterialIcons name="logout" size={24} color={interactiveIconColor} />
                  <ThemedText style={styles.menuItemText}>Sign Out</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.themeToggleContainer,
                  { borderTopColor: colorScheme === 'dark' ? colors.border : colors.borderMuted },
                ]}>
                <View style={styles.themeToggleLabelGroup}>
                  <MaterialIcons
                    name={isDarkMode ? 'dark-mode' : 'light-mode'}
                    size={22}
                    color={colors.icon}
                  />
                  <ThemedText style={styles.themeToggleLabel}>
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </ThemedText>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
                  trackColor={{ false: colors.borderMuted, true: switchActiveTrack }}
                  thumbColor={switchThumbColor}
                  ios_backgroundColor={colors.borderMuted}
                  accessibilityLabel="Toggle dark mode"
                />
              </View>
            </ThemedView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  drawer: {
    width: '75%',
    maxWidth: 320,
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  userName: {
    fontSize: 18,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
  },
  themeToggleContainer: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggleLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggleLabel: {
    fontSize: 16,
  },
});

