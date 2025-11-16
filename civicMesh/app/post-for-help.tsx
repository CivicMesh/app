import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Alert,
  View,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore - expo-location may not be installed
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePosts } from '@/contexts/posts-context';
import { postForHelp } from '@/services/api';
import { CATEGORIES, Category, findCategory } from '@/constants/categories';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Categories now come from constants with subcategories

export default function PostForHelpScreen() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addPost } = usePosts();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // (moved to below handleBack) hardware back handling

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return !!(title.trim() || category || subcategory || description.trim());
  }, [title, category, subcategory, description]);

  // Handle back navigation with confirmation dialog
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved edits. Discard and go back to Home?',
        [
          {
            text: 'Stay',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } else {
      router.replace('/(tabs)');
    }
  }, [hasUnsavedChanges, router]);

  // Handle Android hardware back to go home with confirmation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true; // prevent default behavior
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [handleBack])
  );

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      
      // Check if Location module is available
      if (!Location || typeof Location.requestForegroundPermissionsAsync !== 'function') {
        Alert.alert(
          'Location Service Unavailable',
          'Please install expo-location:\n\nnpx expo install expo-location',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to post for help. This allows us to geotag your post.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });
    } catch (err: any) {
      console.error('Error getting location:', err);
      const errorMessage = err?.message?.includes('expo-location') || err?.code === 'MODULE_NOT_FOUND'
        ? 'Please install expo-location: npx expo install expo-location'
        : 'Failed to get your location. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    if (!subcategory) {
      setError('Please select a subcategory');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!location) {
      setError('Location is required. Please allow location access.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await postForHelp({
        title: title.trim(),
        category,
        subcategory,
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        userId: user?.id || user?.email,
      });

      if (result.success && result.data) {
        // Add post to context immediately
        addPost(result.data);
        Alert.alert('Success', 'Your post has been submitted successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        setError(result.error || 'Failed to submit post');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
      <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Post for Help
          </ThemedText>
          <ThemedText style={styles.subtitle}>Share your needs with the community</ThemedText>

          {error ? (
            <ThemedView style={[styles.errorContainer, { backgroundColor: '#ffebee' }]}>
              <ThemedText style={[styles.errorText, { color: '#c62828' }]}>{error}</ThemedText>
            </ThemedView>
          ) : null}

          <ThemedView style={styles.form}>
            {/* Title Field */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Title *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                    color: colors.text,
                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Enter a title for your post"
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </ThemedView>

            {/* Category Field */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Category *</ThemedText>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor:
                          category === cat.value
                            ? colors.tint
                            : colorScheme === 'dark'
                              ? '#2a2a2a'
                              : '#f5f5f5',
                        borderColor: category === cat.value ? colors.tint : colorScheme === 'dark' ? '#444' : '#ddd',
                      },
                    ]}
                    onPress={() => {
                      setCategory(cat.value);
                      setSubcategory(null);
                    }}
                    disabled={loading}>
                    <MaterialIcons
                      name={cat.icon as any}
                      size={20}
                      color={category === cat.value ? (colorScheme === 'dark' ? '#000' : '#fff') : colors.text}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        {
                          color: category === cat.value ? (colorScheme === 'dark' ? '#000' : '#fff') : colors.text,
                        },
                      ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedView>

            {/* Subcategory Field (depends on Category) */}
            {category && (
              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Subcategory *</ThemedText>
                <View style={styles.categoryContainer}>
                  {findCategory(category)?.subcategories.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor:
                            subcategory === sub.id
                              ? colors.tint
                              : colorScheme === 'dark'
                                ? '#2a2a2a'
                                : '#f5f5f5',
                          borderColor: subcategory === sub.id ? colors.tint : colorScheme === 'dark' ? '#444' : '#ddd',
                        },
                      ]}
                      onPress={() => setSubcategory(sub.id)}
                      disabled={loading}>
                      <MaterialIcons
                        name={
                          // try to reuse same icon as category for now
                          (CATEGORIES.find((c) => c.value === category)?.icon || 'label') as any
                        }
                        size={20}
                        color={subcategory === sub.id ? (colorScheme === 'dark' ? '#000' : '#fff') : colors.text}
                      />
                      <Text
                        style={[
                          styles.categoryButtonText,
                          {
                            color: subcategory === sub.id ? (colorScheme === 'dark' ? '#000' : '#fff') : colors.text,
                          },
                        ]}>
                        {sub.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ThemedView>
            )}

            {/* Description Field */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Description *</ThemedText>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                    color: colors.text,
                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Describe what you need help with..."
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!loading}
              />
            </ThemedView>

            {/* Location Status */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Location</ThemedText>
              {locationLoading ? (
                <View style={styles.locationStatus}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText style={styles.locationText}>Getting your location...</ThemedText>
                </View>
              ) : location ? (
                <View style={styles.locationStatus}>
                  <MaterialIcons name="location-on" size={20} color={colors.tint} />
                  <ThemedText style={styles.locationText}>
                    Location captured
                  </ThemedText>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.locationButton, { backgroundColor: colors.tint }]}
                  onPress={requestLocationPermission}
                  disabled={loading || locationLoading}>
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#000' : '#fff'} />
                  ) : (
                    <>
                      <MaterialIcons name="location-on" size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                      <Text style={[styles.locationButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                        Get Location
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </ThemedView>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleSubmit}
              disabled={loading || !location}>
              {loading ? (
                <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
              ) : (
                <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                  Submit Post
                </Text>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    minWidth: '45%',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  locationText: {
    fontSize: 14,
    opacity: 0.7,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
});

