export type Category = 'alert' | 'warning' | 'help' | 'resources' | 'accessibility resources';

export type Subcategory = {
  id: string; // stable id/slug for filters
  label: string; // human readable
};

export const CATEGORIES: { value: Category; label: string; icon: string; subcategories: Subcategory[] }[] = [
  {
    value: 'alert',
    label: 'Alert',
    icon: 'warning',
    subcategories: [
      { id: 'crime', label: 'Crime' },
      { id: 'accident', label: 'Accident' },
      { id: 'natural-disaster', label: 'Natural Disaster' },
      { id: 'fire', label: 'Fire' },
      { id: 'medical-emergency', label: 'Medical Emergency' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    value: 'warning',
    label: 'Warning',
    icon: 'error',
    subcategories: [
      { id: 'road-closure', label: 'Road Closure' },
      { id: 'weather', label: 'Weather' },
      { id: 'health-advisory', label: 'Health Advisory' },
      { id: 'safety-alert', label: 'Safety Alert' },
      { id: 'construction', label: 'Construction' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    value: 'help',
    label: 'Help',
    icon: 'help',
    subcategories: [
      { id: 'medical', label: 'Medical' },
      { id: 'shelter', label: 'Shelter' },
      { id: 'food', label: 'Food' },
      { id: 'transportation', label: 'Transportation' },
      { id: 'information', label: 'Information' },
      { id: 'rescue', label: 'Rescue' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    value: 'resources',
    label: 'Resources',
    icon: 'inventory',
    subcategories: [
      { id: 'food-bank', label: 'Food Bank' },
      { id: 'water', label: 'Water' },
      { id: 'shelter', label: 'Shelter' },
      { id: 'medical-supplies', label: 'Medical Supplies' },
      { id: 'charging-station', label: 'Charging Station' },
      { id: 'wifi', label: 'WiFi' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    value: 'accessibility resources',
    label: 'Accessibility Resources',
    icon: 'accessible',
    subcategories: [
      { id: 'wheelchair-access', label: 'Wheelchair Access' },
      { id: 'sign-language', label: 'Sign Language' },
      { id: 'visual-aids', label: 'Visual Aids' },
      { id: 'hearing-assistance', label: 'Hearing Assistance' },
      { id: 'accessible-restroom', label: 'Accessible Restroom' },
      { id: 'parking', label: 'Parking' },
      { id: 'other', label: 'Other' },
    ],
  },
];

export function findCategory(value: Category) {
  return CATEGORIES.find((c) => c.value === value);
}
