import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function NativeMapScreen() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ThemedText>Native map screen is unavailable on web.</ThemedText>
    </ThemedView>
  );
}
