import { useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, getCategorySemanticColor, getCategorySemanticBg } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePosts } from '@/contexts/posts-context';
import { Post } from '@/services/api';
import { useFilters } from '@/contexts/filter-context';

const CATEGORY_ICONS: Record<Post['category'], string> = {
  alert: 'warning',
  warning: 'error',
  help: 'help',
  resources: 'inventory',
  'accessibility resources': 'accessible',
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

type FeedItemProps = {
  post: Post;
  showDescription: boolean;
};

function FeedItem({ post, showDescription }: FeedItemProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const categoryColor = getCategorySemanticColor(mode, post.category);
  const categoryBg = getCategorySemanticBg(mode, post.category);
  const categoryIcon = CATEGORY_ICONS[post.category];

  const onMyWayCount = post.onMyWayBy?.length || 0;
  const isResolved = !!post.resolvedBy;
  const resolvedColor = colors.semantic.resources;
  const resolvedBg = colors.semanticBg.resources;
  const onMyWayColor = mode === 'dark' ? '#FFFFFF' : '#000000';
  const onMyWayBg = mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <TouchableOpacity
      style={[
        styles.feedItem,
        {
          backgroundColor: colors.surface,
          borderLeftColor: categoryColor,
          shadowColor: colorScheme === 'dark' ? '#000' : '#000',
        },
      ]}
      onPress={() => router.push(`/post-detail?id=${post.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${post.title}`}>
      <View style={styles.feedItemHeader}>
        <View style={[styles.feedItemIconContainer, { backgroundColor: categoryBg }]}>
          <MaterialIcons name={categoryIcon as any} size={20} color={categoryColor} />
        </View>
        <View style={styles.feedItemContent}>
          <View style={styles.feedItemTitleRow}>
            <ThemedText type="defaultSemiBold" style={styles.feedItemTitle}>
              {post.title}
            </ThemedText>
            {isResolved ? (
              <View style={[styles.statusBadge, { backgroundColor: resolvedBg }]}>
                <ThemedText style={[styles.statusBadgeText, { color: resolvedColor }]}>Resolved</ThemedText>
              </View>
            ) : onMyWayCount > 0 ? (
              <View style={[styles.statusBadge, { backgroundColor: onMyWayBg }]}>
                <ThemedText style={[styles.statusBadgeText, { color: onMyWayColor }]}>On My Way ({onMyWayCount})</ThemedText>
              </View>
            ) : null}
          </View>
          {post.subcategory ? (
            <ThemedText style={[styles.feedItemSubcategory, { color: categoryColor }]}>
              {post.subcategory}
            </ThemedText>
          ) : null}
          {showDescription ? (
            <ThemedText style={styles.feedItemMessage}>{post.description}</ThemedText>
          ) : null}
          <ThemedText style={styles.feedItemTimestamp}>{formatTimestamp(post.timestamp || post.createdAt)}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

type FeedProps = {
  hideHeader?: boolean;
  showDescription?: boolean;
};

export function Feed({ hideHeader = false, showDescription = false }: FeedProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { posts, isLoading } = usePosts();
  const { selectedCategories, selectedSubcategories, hasActiveFilters, clearFilters } = useFilters('feed');
  const headerIconColor = colors.tint;

  const filteredPosts = useMemo(() => {
    if (!hasActiveFilters) {
      return posts;
    }

    const categorySet = new Set(selectedCategories);
    const subcategorySet = new Set(
      Object.values(selectedSubcategories).reduce<string[]>((acc, curr = []) => acc.concat(curr), [])
    );

    const hasCategoryFilters = categorySet.size > 0;
    const hasSubcategoryFilters = subcategorySet.size > 0;

    return posts.filter((postItem) => {
      const categoryMatch = hasCategoryFilters ? categorySet.has(postItem.category) : true;
      const subcategoryMatch = hasSubcategoryFilters
        ? (postItem.subcategory ? subcategorySet.has(postItem.subcategory) : false)
        : true;
      return categoryMatch && subcategoryMatch;
    });
  }, [hasActiveFilters, posts, selectedCategories, selectedSubcategories]);

  const showNoPosts = !isLoading && posts.length === 0;
  const showNoMatches = !isLoading && posts.length > 0 && filteredPosts.length === 0 && hasActiveFilters;

  return (
    <ThemedView style={styles.container}>
      {!hideHeader && (
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/active-feed')} accessibilityRole="button" accessibilityLabel="Open active feed">
            <ThemedText type="subtitle">Active Feed</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/active-feed')}
            accessibilityRole="button"
            accessibilityLabel="Open active feed"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="reader-outline" size={26} color={headerIconColor} />
          </TouchableOpacity>
        </ThemedView>
      )}
      <ScrollView
        style={styles.feedList}
        contentContainerStyle={styles.feedListContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
          </View>
        ) : showNoPosts ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={48} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Be the first to post for help!</ThemedText>
          </View>
        ) : showNoMatches ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="filter-list" size={48} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No posts match these filters</ThemedText>
            <ThemedText style={styles.emptySubtext}>Adjust or clear your filters to see more posts.</ThemedText>
            <TouchableOpacity
              style={[styles.clearFiltersButton, { borderColor: colors.tint }]}
              onPress={clearFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear filters">
              <MaterialIcons name="refresh" size={18} color={colors.tint} style={styles.clearFiltersIcon} />
              <ThemedText style={[styles.clearFiltersText, { color: colors.tint }]}>Reset filters</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPosts.map((postItem) => (
            <FeedItem key={postItem.id} post={postItem} showDescription={showDescription} />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    flex: 1,
    flexWrap: 'wrap',
  },
  feedItemTimestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  feedItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  feedItemSubcategory: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 2,
    flexWrap: 'wrap',
    flexShrink: 1,
    alignSelf: 'flex-start',
  },
  feedItemMessage: {
    fontSize: 14,
    opacity: 0.85,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
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
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    borderColor: 'transparent',
  },
  clearFiltersIcon: {
    marginRight: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
