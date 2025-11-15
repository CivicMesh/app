import { StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

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
                  backgroundColor: colors.background,
                  paddingTop: insets.top + 20,
                  paddingBottom: insets.bottom + 20,
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
                    { borderBottomColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
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
                  style={[styles.menuItem, { borderBottomColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={onSignOut}
                  activeOpacity={0.7}>
                  <MaterialIcons name="logout" size={24} color={colors.tint} />
                  <ThemedText style={styles.menuItemText}>Sign Out</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={colors.icon} />
                </TouchableOpacity>
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
});

