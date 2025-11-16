import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, getCategorySemanticBg, getCategorySemanticColor } from '@/constants/theme';
import { CATEGORIES } from '@/constants/categories';
import { FilterScope, useFilters } from '@/contexts/filter-context';
import { usePosts } from '@/contexts/posts-context';

const PANEL_MAX_WIDTH = 360;

export type FilterPanelProps = {
  visible: boolean;
  onClose: () => void;
  scope: FilterScope;
};

export function FilterPanel({ visible, onClose, scope }: FilterPanelProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const { posts } = usePosts();
  const {
    hasActiveFilters,
    activeFiltersCount,
    clearFilters,
    toggleCategory,
    toggleSubcategory,
    isCategorySelected,
    isSubcategorySelected,
    selectedCategories,
    selectedSubcategories,
  } = useFilters(scope);

  const windowWidth = Dimensions.get('window').width;
  const panelWidth = useMemo(() => Math.min(windowWidth * 0.85, PANEL_MAX_WIDTH), [windowWidth]);
  const translateX = useRef(new Animated.Value(panelWidth)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  const filteredPostsCount = useMemo(() => {
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
    }).length;
  }, [posts, selectedCategories, selectedSubcategories]);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateX.setValue(panelWidth);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
      }).start();
    } else {
      Animated.spring(translateX, {
        toValue: panelWidth,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
      }).start(({ finished }) => {
        if (finished) {
          setModalVisible(false);
        }
      });
    }
  }, [visible, panelWidth, translateX]);

  if (!modalVisible) {
    return null;
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.panel,
                {
                  width: panelWidth,
                  paddingTop: insets.top + 24,
                  paddingBottom: insets.bottom + 24,
                  backgroundColor: colors.elevation2,
                  borderColor: colors.border,
                  transform: [{ translateX }],
                },
              ]}>
              <View style={styles.panelHeader}>
                <View>
                  <ThemedText type="title" style={styles.title}>
                    Filters
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {hasActiveFilters ? `Active filters: ${activeFiltersCount}` : 'Showing all posts'}
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {filteredPostsCount === 0
                      ? 'No posts match these filters'
                      : `${filteredPostsCount} post${filteredPostsCount === 1 ? '' : 's'} visible`}
                  </ThemedText>
                </View>
                <View style={styles.headerActions}>
                  {hasActiveFilters && (
                    <TouchableOpacity
                      onPress={clearFilters}
                      style={[styles.resetButton, { borderColor: colorScheme === 'dark' ? colors.border : colors.borderMuted }]}
                      accessibilityRole="button"
                      accessibilityLabel="Clear all filters">
                      <MaterialIcons name="refresh" size={20} color={colors.tint} style={styles.resetIcon} />
                      <ThemedText style={[styles.resetText, { color: colors.tint }]}>Reset</ThemedText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Close filters">
                    <MaterialIcons name="close" size={24} color={colors.icon} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                {CATEGORIES.map((category) => {
                  const categoryColor = getCategorySemanticColor(mode, category.value);
                  const categoryBg = getCategorySemanticBg(mode, category.value);
                  const selected = isCategorySelected(category.value);

                  return (
                    <ThemedView
                      key={category.value}
                      style={[
                        styles.categoryBlock,
                        {
                          borderColor: colorScheme === 'dark' ? colors.border : colors.borderMuted,
                          backgroundColor: selected ? colors.surface : colors.background,
                        },
                      ]}>
                      <TouchableOpacity
                        style={styles.categoryRow}
                        onPress={() => toggleCategory(category.value)}
                        accessibilityRole="button"
                        accessibilityLabel={`Toggle category ${category.label}`}>
                        <View style={styles.categoryInfo}>
                          <View style={[styles.categoryIcon, { backgroundColor: categoryBg }] }>
                            <MaterialIcons name={category.icon as any} size={20} color={categoryColor} />
                          </View>
                          <ThemedText type="defaultSemiBold" style={styles.categoryLabel}>
                            {category.label}
                          </ThemedText>
                        </View>
                        <MaterialIcons
                          name={selected ? 'check-box' : 'check-box-outline-blank'}
                          size={24}
                          color={selected ? colors.tint : colors.icon}
                        />
                      </TouchableOpacity>

                      <View style={styles.subcategoryList}>
                        {category.subcategories.map((sub) => {
                          const subSelected = isSubcategorySelected(category.value, sub.id);
                          return (
                            <TouchableOpacity
                              key={sub.id}
                              style={[
                                styles.subcategoryChip,
                                {
                                  borderColor: subSelected ? categoryColor : colorScheme === 'dark' ? colors.border : colors.borderMuted,
                                  backgroundColor: subSelected ? categoryBg : 'transparent',
                                },
                              ]}
                              onPress={() => toggleSubcategory(category.value, sub.id)}
                              accessibilityRole="button"
                              accessibilityLabel={`Toggle subcategory ${sub.label}`}>
                              <ThemedText
                                style={[
                                  styles.subcategoryText,
                                  { color: subSelected ? categoryColor : colors.text },
                                ]}>
                                {sub.label}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ThemedView>
                  );
                })}
              </ScrollView>
            </Animated.View>
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
    justifyContent: 'flex-end',
  },
  panel: {
    height: '100%',
    borderLeftWidth: 1,
    paddingHorizontal: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  resetIcon: {
    marginRight: 6,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 6,
    marginRight: -6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  categoryBlock: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  subcategoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subcategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  subcategoryText: {
    fontSize: 13,
  },
});
