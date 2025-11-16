import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { usePosts } from '@/contexts/posts-context';
import { Post } from '@/services/api';

const CATEGORY_ICONS: Record<Post['category'], string> = {
  alert: 'warning',
  warning: 'error',
  help: 'help',
  resources: 'inventory',
  'accessibility resources': 'accessible',
};

const CATEGORY_COLORS: Record<Post['category'], string> = {
  alert: '#ff4444',
  warning: '#ffaa00',
  help: '#0a7ea4',
  resources: '#4caf50',
  'accessibility resources': '#9c27b0',
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

function FeedItem({ post }: { post: Post }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const categoryColor = CATEGORY_COLORS[post.category];
  const categoryIcon = CATEGORY_ICONS[post.category];

  return (
    <TouchableOpacity
      style={[
        styles.feedItem,
        {
          backgroundColor: colors.background,
          borderLeftColor: categoryColor,
        },
      ]}>
      <View style={styles.feedItemHeader}>
        <View style={[styles.feedItemIconContainer, { backgroundColor: categoryColor + '20' }]}>
          <MaterialIcons name={categoryIcon as any} size={20} color={categoryColor} />
        </View>
        <View style={styles.feedItemContent}>
          <View style={styles.feedItemTitleRow}>
            <ThemedText type="defaultSemiBold" style={styles.feedItemTitle}>
              {post.title}
            </ThemedText>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
              <ThemedText style={[styles.categoryBadgeText, { color: categoryColor }]}>
                {post.category}
              </ThemedText>
            </View>
            {post.subcategory ? (
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '10' }]}>
                <ThemedText style={[styles.categoryBadgeText, { color: categoryColor }]}>
                  {post.subcategory}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.feedItemMessage}>{post.description}</ThemedText>
          <ThemedText style={styles.feedItemTimestamp}>{formatTimestamp(post.timestamp || post.createdAt)}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function Feed() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { posts, isLoading } = usePosts();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/active-feed')} accessibilityRole="button" accessibilityLabel="Open active feed">
          <ThemedText type="subtitle">Active Feed</ThemedText>
        </TouchableOpacity>
        <MaterialIcons name="notifications" size={24} color={colors.tint} />
      </ThemedView>
      <ScrollView
        style={styles.feedList}
        contentContainerStyle={styles.feedListContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={48} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Be the first to post for help!</ThemedText>
          </View>
        ) : (
          posts.map((post) => <FeedItem key={post.id} post={post} />)
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedList: {
    flex: 1,
  },
  feedListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  feedItem: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feedItemHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  feedItemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedItemContent: {
    flex: 1,
    gap: 4,
  },
  feedItemTitle: {
    fontSize: 16,
  },
  feedItemMessage: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  feedItemTimestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  feedItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
});

