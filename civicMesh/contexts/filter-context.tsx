import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

import { Category } from '@/constants/categories';

export type FilterScope = 'feed' | 'map';

type SelectedSubcategories = Partial<Record<Category, string[]>>;

type FiltersContextType = {
  selectedCategoriesByScope: Record<FilterScope, Category[]>;
  selectedSubcategoriesByScope: Record<FilterScope, SelectedSubcategories>;
  toggleCategory: (scope: FilterScope, category: Category) => void;
  toggleSubcategory: (scope: FilterScope, category: Category, subId: string) => void;
  clearFilters: (scope: FilterScope) => void;
};

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

const INITIAL_CATEGORIES: Record<FilterScope, Category[]> = {
  feed: [],
  map: [],
};

const INITIAL_SUBCATEGORIES: Record<FilterScope, SelectedSubcategories> = {
  feed: {},
  map: {},
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedCategoriesByScope, setSelectedCategoriesByScope] = useState<Record<FilterScope, Category[]>>(INITIAL_CATEGORIES);
  const [selectedSubcategoriesByScope, setSelectedSubcategoriesByScope] = useState<Record<FilterScope, SelectedSubcategories>>(INITIAL_SUBCATEGORIES);

  const toggleCategory = useCallback((scope: FilterScope, category: Category) => {
    setSelectedCategoriesByScope((prev) => {
      const current = prev[scope] ?? [];
      const isSelected = current.includes(category);
      const nextCategories = isSelected ? current.filter((value) => value !== category) : [...current, category];

      if (isSelected) {
        setSelectedSubcategoriesByScope((prevSubs) => {
          const scopedSubs = prevSubs[scope] ?? {};
          if (!(category in scopedSubs)) {
            return prevSubs;
          }
          const { [category]: _removed, ...restScoped } = scopedSubs;
          return { ...prevSubs, [scope]: restScoped };
        });
      }

      return { ...prev, [scope]: nextCategories };
    });
  }, []);

  const toggleSubcategory = useCallback((scope: FilterScope, category: Category, subId: string) => {
    setSelectedSubcategoriesByScope((prev) => {
      const scopedSubs = prev[scope] ?? {};
      const current = scopedSubs[category] ?? [];
      const isSelected = current.includes(subId);
      const next = isSelected ? current.filter((id) => id !== subId) : [...current, subId];
      const updatedScoped = { ...scopedSubs } as SelectedSubcategories;

      if (next.length === 0) {
        delete updatedScoped[category];
      } else {
        updatedScoped[category] = next;
      }

      return { ...prev, [scope]: updatedScoped };
    });

    setSelectedCategoriesByScope((prev) => {
      const currentCategories = prev[scope] ?? [];
      if (currentCategories.includes(category)) {
        return prev;
      }
      return { ...prev, [scope]: [...currentCategories, category] };
    });
  }, []);

  const clearFilters = useCallback((scope: FilterScope) => {
    setSelectedCategoriesByScope((prev) => ({ ...prev, [scope]: [] }));
    setSelectedSubcategoriesByScope((prev) => ({ ...prev, [scope]: {} }));
  }, []);

  const value = useMemo<FiltersContextType>(
    () => ({
      selectedCategoriesByScope,
      selectedSubcategoriesByScope,
      toggleCategory,
      toggleSubcategory,
      clearFilters,
    }),
    [selectedCategoriesByScope, selectedSubcategoriesByScope, toggleCategory, toggleSubcategory, clearFilters]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

function computeSelectedSubcategorySet(selectedSubcategories: SelectedSubcategories) {
  const allSubcategories = Object.values(selectedSubcategories).flat();
  return new Set(allSubcategories);
}

export function useFilters(scope: FilterScope) {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }

  const { selectedCategoriesByScope, selectedSubcategoriesByScope, toggleCategory, toggleSubcategory, clearFilters } = context;

  const selectedCategories = selectedCategoriesByScope[scope] ?? [];
  const selectedSubcategories = selectedSubcategoriesByScope[scope] ?? {};

  const selectedCategorySet = useMemo(() => new Set(selectedCategories), [selectedCategories]);
  const selectedSubcategorySet = useMemo(() => computeSelectedSubcategorySet(selectedSubcategories), [selectedSubcategories]);

  const toggleCategoryScoped = useCallback((category: Category) => toggleCategory(scope, category), [toggleCategory, scope]);
  const toggleSubcategoryScoped = useCallback((category: Category, subId: string) => toggleSubcategory(scope, category, subId), [toggleSubcategory, scope]);
  const clearFiltersScoped = useCallback(() => clearFilters(scope), [clearFilters, scope]);

  const isCategorySelected = useCallback((category: Category) => selectedCategorySet.has(category), [selectedCategorySet]);
  const isSubcategorySelected = useCallback(
    (category: Category, subId: string) => {
      const values = selectedSubcategories[category] ?? [];
      return values.includes(subId);
    },
    [selectedSubcategories]
  );

  const hasActiveFilters = selectedCategories.length > 0 || Object.keys(selectedSubcategories).length > 0;
  const activeFiltersCount = useMemo(() => {
    const base = selectedCategories.length;
    const subs = Object.values(selectedSubcategories).reduce((acc, curr) => acc + curr.length, 0);
    return base + subs;
  }, [selectedCategories, selectedSubcategories]);

  return {
    selectedCategories,
    selectedSubcategories,
    selectedCategorySet,
    selectedSubcategorySet,
    toggleCategory: toggleCategoryScoped,
    toggleSubcategory: toggleSubcategoryScoped,
    clearFilters: clearFiltersScoped,
    isCategorySelected,
    isSubcategorySelected,
    hasActiveFilters,
    activeFiltersCount,
  };
}
