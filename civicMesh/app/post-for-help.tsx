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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore - expo-location may not be installed
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
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
    return !!(title.trim() || category || subcategory || description.trim() || photoUri || videoUri);
  }, [title, category, subcategory, description, photoUri, videoUri]);

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

  const pickPhoto = async () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please enable camera access to take a photo.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please enable photo library access to add a photo.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error picking photo:', error);
              Alert.alert('Error', 'Failed to pick photo. Please try again.');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickVideo = async () => {
    Alert.alert(
      'Add Video',
      'Choose an option',
      [
        {
          text: 'Record Video',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please enable camera access to record a video.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setVideoUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error recording video:', error);
              Alert.alert('Error', 'Failed to record video. Please try again.');
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please enable photo library access to add a video.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setVideoUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error picking video:', error);
              Alert.alert('Error', 'Failed to pick video. Please try again.');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
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

    if (!photoUri) {
      setError('Photo is required. Please add a photo.');
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
        photoUri,
        videoUri: videoUri || undefined,
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
    } catch (error) {
      console.error('Error submitting post-for-help form:', error);
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

            {/* Photo Field (Required) */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Photo *</ThemedText>
              {photoUri ? (
                <View style={styles.mediaPreviewContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={[styles.changeMediaButton, { backgroundColor: colors.tint }]}
                    onPress={pickPhoto}
                    disabled={loading}>
                    <MaterialIcons name="edit" size={16} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                    <Text style={[styles.changeMediaButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                      Change Photo
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.mediaButton, { backgroundColor: colors.tint }]}
                  onPress={pickPhoto}
                  disabled={loading}>
                  <MaterialIcons name="add-a-photo" size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                  <Text style={[styles.mediaButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </ThemedView>

            {/* Video Field (Optional) */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Video (Optional)</ThemedText>
              {videoUri ? (
                <View style={styles.mediaPreviewContainer}>
                  <View style={styles.videoPreview}>
                    <MaterialIcons name="videocam" size={48} color={colors.tint} />
                    <ThemedText style={styles.videoPreviewText}>Video selected</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.changeMediaButton, { backgroundColor: colors.tint }]}
                    onPress={pickVideo}
                    disabled={loading}>
                    <MaterialIcons name="edit" size={16} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                    <Text style={[styles.changeMediaButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                      Change Video
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.mediaButton, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5', borderWidth: 1, borderColor: colorScheme === 'dark' ? '#444' : '#ddd' }]}
                  onPress={pickVideo}
                  disabled={loading}>
                  <MaterialIcons name="videocam" size={20} color={colors.text} />
                  <Text style={[styles.mediaButtonText, { color: colors.text }]}>
                    Add Video
                  </Text>
                </TouchableOpacity>
              )}
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
  mediaPreviewContainer: {
    gap: 12,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  changeMediaButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

