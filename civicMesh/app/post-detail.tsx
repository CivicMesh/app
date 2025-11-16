import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Text,
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, getCategorySemanticColor, getCategorySemanticBg } from '@/constants/theme';
import { usePosts } from '@/contexts/posts-context';
import { Post, markOnMyWay, resolvePost } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';

// Category colors now derived from semantic tokens in theme.
function getCategoryColors(mode: 'light' | 'dark', category: Post['category']) {
  return {
    fg: getCategorySemanticColor(mode, category),
    bg: getCategorySemanticBg(mode, category),
    subtleBg: getCategorySemanticBg(mode, category),
  };
}

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

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { posts, updatePost } = usePosts();
  const { user } = useAuth();
  
  const post = posts.find((p) => p.id === params.id);

  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionCode, setResolutionCode] = useState('');
  const [resolutionPhotoUri, setResolutionPhotoUri] = useState<string | null>(null);
  const [resolutionVideoUri, setResolutionVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  // Hardware back should go to home
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        router.replace('/(tabs)');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [router])
  );

  const handleOnMyWay = async () => {
    if (!post || !user) return;

    setLoading(true);
    try {
      const result = await markOnMyWay(post.id, user.id || user.email);
      
      if (result.success && result.data) {
        updatePost(post.id, result.data);
        Alert.alert('On My Way!', 'You have marked yourself as on the way to help with this post.', [
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to mark on my way. Please try again.');
      }
    } catch (error) {
      console.error('Error marking on my way:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    if (!post) return;

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${post.latitude},${post.longitude}`;
    const label = post.title;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to web URL if native app not available
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const pickResolutionPhoto = async () => {
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
                setResolutionPhotoUri(result.assets[0].uri);
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
                setResolutionPhotoUri(result.assets[0].uri);
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

  const pickResolutionVideo = async () => {
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
                setResolutionVideoUri(result.assets[0].uri);
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
                setResolutionVideoUri(result.assets[0].uri);
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

  const handleResolve = async () => {
    if (!post || !user) return;

    if (!resolutionCode.trim()) {
      Alert.alert('Error', 'Please enter a resolution code.');
      return;
    }

    if (!resolutionPhotoUri) {
      Alert.alert('Error', 'Photo is required to resolve this post.');
      return;
    }

    setLoading(true);
    
    try {
      const result = await resolvePost({
        postId: post.id,
        userId: user.id || user.email,
        resolutionCode: resolutionCode.trim(),
        resolutionPhotoUri,
        resolutionVideoUri: resolutionVideoUri || undefined,
      });

      if (result.success && result.data) {
        updatePost(post.id, result.data);
        setLoading(false);
        Alert.alert('Success', 'Post has been marked as resolved!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        setLoading(false);
        Alert.alert('Error', result.error || 'Failed to resolve post. Please try again.');
      }
    } catch (error) {
      console.error('Error resolving post:', error);
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  if (!post) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: borderColor }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.replace('/(tabs)')} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Post Details</ThemedText>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={64} color={colors.icon} />
          <ThemedText style={styles.errorText}>Post not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const categoryColors = getCategoryColors(colorScheme === 'dark' ? 'dark' : 'light', post.category);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: borderColor }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.replace('/(tabs)')} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Post Details</ThemedText>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Post Photo */}
        {post.photoUri && (
          <Image source={{ uri: post.photoUri }} style={styles.postPhoto} />
        )}

        {/* Post Info */}
        <View style={styles.postInfo}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColors.bg }]}>
              <ThemedText style={[styles.categoryBadgeText, { color: categoryColors.fg }]}>
                {post.category}
              </ThemedText>
            </View>
            {post.subcategory && (
              <View style={[styles.categoryBadge, { backgroundColor: categoryColors.bg }]}>
                <ThemedText style={[styles.categoryBadgeText, { color: categoryColors.fg }]}>
                  {post.subcategory}
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText type="title" style={styles.postTitle}>{post.title}</ThemedText>
          
          <View style={styles.metaRow}>
            <MaterialIcons name="access-time" size={16} color={colors.icon} />
            <ThemedText style={styles.metaText}>
              {formatTimestamp(post.timestamp || post.createdAt)}
            </ThemedText>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.metaRow}>
              <MaterialIcons name="location-on" size={16} color={colors.icon} />
              <ThemedText style={styles.metaText}>
                {post.latitude.toFixed(4)}, {post.longitude.toFixed(4)}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.mapsButton, { backgroundColor: colors.tint }]}
              onPress={openInGoogleMaps}>
              <MaterialIcons name="map" size={16} color={colorScheme === 'dark' ? '#000' : '#fff'} />
              <Text style={[styles.mapsButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                Open in Maps
              </Text>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.description}>{post.description}</ThemedText>

          {/* Video if available */}
          {post.videoUri && (
            <View style={styles.videoContainer}>
              <MaterialIcons name="videocam" size={48} color={colors.tint} />
              <ThemedText style={styles.videoText}>Video attached</ThemedText>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleOnMyWay}>
            <MaterialIcons name="directions-run" size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
            <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
              On My Way
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
            onPress={() => setShowResolveForm(!showResolveForm)}>
            <MaterialIcons name="check-circle" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              {showResolveForm ? 'Cancel Resolve' : 'Resolve'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resolve Form */}
        {showResolveForm && (
          <View style={[styles.resolveForm, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f9f9f9', borderColor: borderColor }]}>
            <ThemedText type="subtitle" style={styles.resolveTitle}>Resolve Post</ThemedText>

            {/* Resolution Code */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Resolution Code *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff',
                    color: colors.text,
                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Enter resolution code"
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={resolutionCode}
                onChangeText={setResolutionCode}
                editable={!loading}
              />
            </View>

            {/* Resolution Photo */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Photo *</ThemedText>
              {resolutionPhotoUri ? (
                <View style={styles.mediaPreviewContainer}>
                  <Image source={{ uri: resolutionPhotoUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={[styles.changeMediaButton, { backgroundColor: colors.tint }]}
                    onPress={pickResolutionPhoto}
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
                  onPress={pickResolutionPhoto}
                  disabled={loading}>
                  <MaterialIcons name="add-a-photo" size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                  <Text style={[styles.mediaButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Resolution Video (Optional) */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Video (Optional)</ThemedText>
              {resolutionVideoUri ? (
                <View style={styles.mediaPreviewContainer}>
                  <View style={styles.videoPreview}>
                    <MaterialIcons name="videocam" size={48} color={colors.tint} />
                    <ThemedText style={styles.videoPreviewText}>Video selected</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.changeMediaButton, { backgroundColor: colors.tint }]}
                    onPress={pickResolutionVideo}
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
                  onPress={pickResolutionVideo}
                  disabled={loading}>
                  <MaterialIcons name="videocam" size={20} color={colors.text} />
                  <Text style={[styles.mediaButtonText, { color: colors.text }]}>
                    Add Video
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Resolve */}
            <TouchableOpacity
              style={[styles.resolveButton, { backgroundColor: '#4caf50' }]}
              onPress={handleResolve}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.resolveButtonText, { color: '#fff' }]}>
                  Submit Resolution
                </Text>
              )}
            </TouchableOpacity>
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  postPhoto: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  postInfo: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  postTitle: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    opacity: 0.7,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  mapsButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  videoContainer: {
    marginTop: 16,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  videoText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resolveForm: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resolveTitle: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  resolveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  resolveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
