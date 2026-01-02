import { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useFilters } from '@/contexts/filter-context';
import { usePosts } from '@/contexts/posts-context';
import { NativeMapScreen } from '@/features/map/native-map-screen';

export default function MapScreen() {
	if (Platform.OS !== 'web') {
		return <NativeMapScreen />;
	}

	const router = useRouter();
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
	const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
	const cardBackground = colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
	const { posts } = usePosts();
	const { selectedCategories, selectedSubcategories } = useFilters('map');

	const filteredPosts = useMemo(() => {
		const categorySet = new Set(selectedCategories);
		const subcategorySet = new Set(
			Object.values(selectedSubcategories).reduce<string[]>((acc, curr = []) => acc.concat(curr), [])
		);

		const hasCategoryFilters = categorySet.size > 0;
		const hasSubcategoryFilters = subcategorySet.size > 0;

		return posts.filter((post) => {
			const categoryMatch = hasCategoryFilters ? categorySet.has(post.category) : true;
			const subcategoryMatch = hasSubcategoryFilters
				? (post.subcategory ? subcategorySet.has(post.subcategory) : false)
				: true;
			return categoryMatch && subcategoryMatch;
		});
	}, [posts, selectedCategories, selectedSubcategories]);

	return (
		<ThemedView style={styles.container}>
			<View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: borderColor }] }>
				<TouchableOpacity
					style={styles.headerButton}
					onPress={() => router.replace('/(tabs)')}
					accessibilityRole="button"
					accessibilityLabel="Go back">
					<MaterialIcons name="arrow-back" size={24} color={iconColor} />
				</TouchableOpacity>
				<ThemedText type="subtitle">Map</ThemedText>
				<TouchableOpacity
					style={styles.headerButton}
					onPress={() => router.push('/(tabs)')}
					accessibilityRole="button"
					accessibilityLabel="Close map placeholder">
					<MaterialIcons name="close" size={24} color={iconColor} />
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }] }>
				<View style={[styles.placeholderCard, { borderColor, backgroundColor: cardBackground }] }>
					<MaterialIcons name="language" size={48} color={colors.tint} />
					<ThemedText style={styles.placeholderTitle}>Interactive map not yet available on web</ThemedText>
					<ThemedText style={styles.placeholderBody}>
						We rely on native map capabilities provided by react-native-maps. Until a web map integration is added, please use a mobile
						device for the full map experience. Below is a list of nearby posts filtered with your current criteria.
					</ThemedText>
				</View>

				{filteredPosts.map((post) => (
					<TouchableOpacity
						key={post.id}
						style={[styles.postCard, { borderColor, backgroundColor: cardBackground }]}
						onPress={() => router.push({ pathname: '/post-detail', params: { id: post.id, from: 'map' } })}
						accessibilityRole="button"
						accessibilityLabel={`Open details for ${post.title}`}>
						<View style={styles.postHeader}>
							<ThemedText type="defaultSemiBold">{post.title}</ThemedText>
							<View style={[styles.chip, { borderColor: colors.tint }] }>
								<ThemedText style={[styles.chipText, { color: colors.tint }]}>{post.category}</ThemedText>
							</View>
						</View>
						<ThemedText numberOfLines={2} style={styles.postDescription}>
							{post.description || 'No description provided.'}
						</ThemedText>
						<ThemedText style={styles.postMeta}>
							Lat: {post.latitude.toFixed(3)} · Lng: {post.longitude.toFixed(3)}
						</ThemedText>
					</TouchableOpacity>
				))}

				{filteredPosts.length === 0 && (
					<View style={[styles.emptyState, { borderColor, backgroundColor: cardBackground }] }>
						<MaterialIcons name="info" size={24} color={colors.tint} />
						<ThemedText style={styles.emptyStateText}>No posts match the current filters.</ThemedText>
					</View>
				)}
			</ScrollView>
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
	scrollContainer: {
		padding: 16,
		gap: 16,
	},
	placeholderCard: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 24,
		alignItems: 'center',
		gap: 12,
	},
	placeholderTitle: {
		fontWeight: '600',
		textAlign: 'center',
	},
	placeholderBody: {
		textAlign: 'center',
		lineHeight: 20,
	},
	postCard: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		gap: 8,
	},
	postHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	chip: {
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	chipText: {
		fontSize: 12,
		textTransform: 'capitalize',
	},
	postDescription: {
		lineHeight: 18,
	},
	postMeta: {
		fontSize: 12,
		opacity: 0.65,
	},
	emptyState: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	emptyStateText: {
		fontSize: 14,
	},
});
