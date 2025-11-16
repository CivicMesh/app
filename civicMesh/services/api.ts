/**
 * services/api.ts
 * Centralized API client for CivicMesh mobile app.
 *
 * Responsibilities:
 * - Environment-based base URL & mock/live switching (USE_MOCK_API)
 * - Data shape normalization (snake_case ↔ camelCase) via normalizePost / buildPostPayload
 * - Authentication: Basic Auth (temporary dev credentials) + generated session token for app context
 * - Media handling: image upload (multipart), numeric image id → embeddable URL
 * - Resilient fetch wrappers returning ApiResponse<T>
 *
 * SECURITY NOTE: Basic Auth credentials & embedded image URLs are development-only.
 * Replace with token-based auth & signed asset URLs before production deployment.
 */
import postsFixture from '@/mock-data/posts.json';
import usersFixture from '@/mock-data/users.json';
import { CATEGORIES, Subcategory } from '@/constants/categories';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encode as b64encode } from 'base-64';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-51lr.onrender.com';

// Set to true to use mock responses (no backend required)
// Change to false or set EXPO_PUBLIC_USE_MOCK_API=false to use real backend
const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

const TOKEN_KEY = '@auth_token';

/**
 * Get stored auth token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Get auth headers with Basic Authentication
 * Uses base-64 polyfill for React Native environments
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const username = 'testuser';
  const password = 'testpassword';

  let basicAuth: string;
  try {
    // Prefer polyfill encode
    basicAuth = b64encode(`${username}:${password}`);
  } catch (e) {
    // Fallbacks if encode fails
    // @ts-ignore
    if (typeof btoa === 'function') {
      // @ts-ignore
      basicAuth = btoa(`${username}:${password}`);
    } else if (typeof Buffer !== 'undefined') {
      // Node fallback (web bundler scenario)
      // @ts-ignore
      basicAuth = Buffer.from(`${username}:${password}`, 'utf-8').toString('base64');
    } else {
      console.warn('No base64 encoder available; Basic Auth may fail');
      basicAuth = '';
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${basicAuth}`,
  };

  console.log('Auth headers constructed:', {
    hasAuth: Boolean(basicAuth),
    preview: basicAuth ? basicAuth.substring(0, 10) + '…' : 'none',
  });

  return headers;
}

type LoginCredentials = {
  email: string;
  password: string;
};

type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  [key: string]: any; // Allow additional fields
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
};


type MockUser = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
};

const mockUsersStorage: MockUser[] = usersFixture.map((user) => ({ ...user }));

/**
 * Mock login function for testing without backend
 */
async function mockLogin(credentials: LoginCredentials): Promise<ApiResponse<any>> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Basic presence validation
  if (!credentials.email || !credentials.password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  const normalizedEmail = credentials.email.trim().toLowerCase();
  const matchedUser = mockUsersStorage.find((user) => user.email.toLowerCase() === normalizedEmail && user.password === credentials.password);

  if (!matchedUser) {
    return {
      success: false,
      error: 'Invalid email or password',
    };
  }

  const { password, ...safeUser } = matchedUser;

  // Simulate successful login
  return {
    success: true,
    data: safeUser,
    token: 'mock-jwt-token-' + Date.now(),
  };
}

/**
 * Login user with GET request
 * @param credentials - User email and password
 * @returns User data and token if successful
 */
export async function login(credentials: LoginCredentials): Promise<ApiResponse<any>> {
  /**
   * LOGIN FLOW
   * Backend expects GET /login/?username=<email>&password=<pwd>
   * Returns: { message, user_id }
   * We synthesize a transient token to store in context (no backend token yet).
   */
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockLogin(credentials);
  }

  try {
    const queryParams = new URLSearchParams();
    queryParams.set('username', credentials.email);
    queryParams.set('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/login/?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || data.error || 'Login failed',
      };
    }

    // Backend returns { message: "Login successful", user_id: number }
    // Create a user object from the response
    const userId = data.user_id || data.id;
    const userData = {
      id: String(userId),
      email: credentials.email,
    };

    return {
      success: true,
      data: userData,
      token: `user-${userId}-${Date.now()}`, // Generate a session token since backend doesn't provide one
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Mock signup function for testing without backend
 */
async function mockSignup(signupData: SignupData): Promise<ApiResponse<any>> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock validation
  if (!signupData.email || !signupData.password || !signupData.firstName || !signupData.lastName) {
    return {
      success: false,
      error: 'All fields are required',
    };
  }

  const trimmedEmail = signupData.email.trim();
  const normalizedEmail = trimmedEmail.toLowerCase();
  const existingUser = mockUsersStorage.find((user) => user.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    return {
      success: false,
      error: 'Email already exists',
    };
  }

  const newUser: MockUser = {
    id: 'mock-user-' + Date.now(),
    email: trimmedEmail,
    password: signupData.password,
    firstName: signupData.firstName,
    lastName: signupData.lastName,
  };

  mockUsersStorage.push(newUser);

  const { password, ...safeUser } = newUser;

  return {
    success: true,
    data: safeUser,
    token: 'mock-jwt-token-' + Date.now(),
  };
}

/**
 * Sign up user with POST request
 * @param signupData - User registration data
 * @returns User data and token if successful
 */
export async function signup(signupData: SignupData): Promise<ApiResponse<any>> {
  /**
   * SIGNUP FLOW
   * POST /users/ with snake_case fields.
   * Response is normalized to camelCase for app usage.
   */
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockSignup(signupData);
  }

  try {
    // Transform camelCase to snake_case for backend
    const backendPayload = {
      email: signupData.email,
      password: signupData.password,
      first_name: signupData.firstName,
      last_name: signupData.lastName,
      username: signupData.email, // Use email as username
    };

    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || data.error || 'Signup failed',
      };
    }

    // Backend returns { id, first_name, last_name, username, password (hashed) }
    // Transform snake_case response to camelCase for our app
    const userData = {
      id: String(data.id),
      email: data.username || signupData.email,
      firstName: data.first_name || signupData.firstName,
      lastName: data.last_name || signupData.lastName,
    };

    return {
      success: true,
      data: userData,
      token: `user-${data.id}-${Date.now()}`, // Generate a session token since backend doesn't provide one
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Logout user (clear token)
 */
export function logout(): void {
  // Clear any stored tokens
  // This can be extended to call a logout endpoint if needed
}

type PostForHelpData = {
  title: string;
  category: 'alert' | 'warning' | 'help' | 'resources' | 'accessibility resources';
  subcategory?: string; // for finer-grained filtering
  description: string;
  latitude: number;
  longitude: number;
  userId?: string;
  photoUri: string; // required
  videoUri?: string; // optional
};

export type Post = {
  id: string;
  title: string;
  category: 'alert' | 'warning' | 'help' | 'resources' | 'accessibility resources';
  subcategory?: string;
  description: string;
  latitude: number;
  longitude: number;
  userId: string;
  timestamp: string;
  createdAt: string;
  photoUri: string;
  videoUri?: string;
  // Status tracking
  onMyWayBy?: string[]; // Array of user IDs who marked "On My Way"
  resolvedBy?: string; // User ID who resolved
  resolutionCode?: string;
  resolutionPhotoUri?: string;
  resolutionVideoUri?: string;
  resolvedAt?: string;
  is_active?: boolean;
  image_url?: string;
  body?: string;
  [key: string]: any;
};

const postsFixtureData = postsFixture as Post[];
let mockPostsStorage: Post[] = postsFixtureData.map((post) => ({ ...post }));

function toBackendCategory(category: Post['category']): string {
  switch (category) {
    case 'alert':
      return 'Alert';
    case 'warning':
      return 'Warning';
    case 'resources':
      return 'Resources';
    case 'accessibility resources':
      return 'Accessibility Resources';
    case 'help':
    default:
      return 'Help';
  }
}

function fromBackendCategory(category: unknown): Post['category'] {
  const normalized = (typeof category === 'string' ? category : '').trim().toLowerCase();
  switch (normalized) {
    case 'alert':
      return 'alert';
    case 'warning':
      return 'warning';
    case 'resources':
      return 'resources';
    case 'accessibility resources':
    case 'accessibility':
      return 'accessibility resources';
    case 'help':
    default:
      return 'help';
  }
}

function toBackendSubcategory(category: Post['category'], subcategoryId?: string): string | null {
  if (!subcategoryId) {
    return null;
  }

  const categoryConfig = CATEGORIES.find((entry) => entry.value === category);
  if (!categoryConfig) {
    return subcategoryId;
  }

  const matched = categoryConfig.subcategories.find((sub: Subcategory) => sub.id === subcategoryId);
  return matched?.label ?? subcategoryId;
}

function fromBackendSubcategory(category: Post['category'], raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) {
    return undefined;
  }

  const normalizedRaw = raw.trim().toLowerCase();
  const categoryConfig = CATEGORIES.find((entry) => entry.value === category);
  const matched = categoryConfig?.subcategories.find((sub) => sub.label.toLowerCase() === normalizedRaw || sub.id === normalizedRaw);
  return matched?.id ?? raw;
}

function normalizePost(raw: any): Post {
  if (!raw) {
    return {
      id: '',
      title: '',
      category: 'help',
      description: '',
      latitude: 0,
      longitude: 0,
      userId: 'unknown',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      photoUri: '',
      onMyWayBy: [],
    };
  }

  const id = raw.id ?? raw.slug ?? raw.pk ?? raw.uuid ?? raw._id ?? raw.postId;
  const createdAt = raw.created_at || raw.createdAt || raw.timestamp || new Date().toISOString();
  const timestamp = raw.updated_at || raw.timestamp || createdAt;
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  const userId = raw.user_id ?? raw.userId ?? raw.user?.id ?? raw.user ?? 'unknown';
  const resolvedBy = raw.resolved_by ?? raw.resolvedBy;
  const normalizedCategory = fromBackendCategory(raw.category);
  // Helper to build image URL if backend returns an ID or numeric string
  const buildImageUrl = (val: any): string => {
    if (val == null) return '';
    const str = String(val).trim();
    if (!str) return '';
    // If already a full URI or data URI
    if (/^(https?:\/\/|data:|file:\/)/i.test(str)) return str;
    // If purely numeric or UUID-like without extension, treat as backend id
    if (/^\d+$/.test(str)) {
      // Embed basic auth credentials for image fetch (RN Image cannot send headers)
      const username = 'testuser';
      const password = 'testpassword';
      const baseHost = API_BASE_URL.replace(/^https?:\/\//, '');
      return `https://${username}:${password}@${baseHost}/image/${str}`;
    }
    return str; // fallback as provided
  };

  const normalizedPost: Post = {
    id: String(id ?? ''),
    title: raw.title ?? '',
  category: normalizedCategory,
  subcategory: fromBackendSubcategory(normalizedCategory, raw.subcategory ?? raw.sub_category),
    description: raw.body ?? raw.description ?? '',
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
    userId: typeof userId === 'number' ? String(userId) : String(userId ?? 'unknown'),
    timestamp: new Date(timestamp).toISOString(),
    createdAt: new Date(createdAt).toISOString(),
    photoUri: buildImageUrl(raw.image_url ?? raw.photoUri ?? raw.imageUrl ?? ''),
    videoUri: raw.video_url ?? raw.videoUri ?? undefined,
    onMyWayBy: Array.isArray(raw.on_my_way_by)
      ? raw.on_my_way_by.map((entry: any) => String(entry))
      : raw.onMyWayBy ?? [],
    resolvedBy: resolvedBy ? String(resolvedBy) : raw.resolvedBy,
    resolutionCode: raw.resolution_code ?? raw.resolutionCode,
    resolutionPhotoUri: raw.resolution_photo_url ?? raw.resolutionPhotoUri,
    resolutionVideoUri: raw.resolution_video_url ?? raw.resolutionVideoUri,
    resolvedAt: raw.resolved_at ?? raw.resolvedAt,
    is_active: raw.is_active ?? raw.isActive,
    image_url: raw.image_url,
    body: raw.body,
  };

  return normalizedPost;
}

/**
 * Upload an image file to backend for a post
 * @param userId User performing upload
 * @param postId Related post id
 * @param localUri React Native file URI
 */
export async function uploadImage(userId: string | number, postId: string | number, localUri: string): Promise<ApiResponse<{ imageUrl: string; raw: any }>> {
  // Basic checks
  if (!localUri || !postId) {
    return { success: false, error: 'Missing image or post id' };
  }

  try {
    const headers = await getAuthHeaders();
    // Remove explicit content-type so fetch sets multipart boundary
    const { ['Content-Type']: _omit, ...restHeaders } = headers as Record<string, string>;

    const formData = new FormData();
    // Infer file extension
    const extMatch = localUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'jpeg' || ext === 'jpg' ? 'image/jpeg' : 'application/octet-stream';
    // React Native's FormData accepts a file object with uri/name/type; cast to any to satisfy TS in web tooling
    formData.append('file', {
      uri: localUri,
      name: `upload.${ext}`,
      type: mime,
    } as any);

    const url = `${API_BASE_URL}/upload-image/${userId}?post_id=${postId}`;
    console.log('Uploading image:', { url, localUri });
    const response = await fetch(url, {
      method: 'POST',
      headers: restHeaders, // no content-type override
      body: formData,
    });

    let data: any = null;
    try { data = await response.json(); } catch { /* non-JSON response */ }
    if (!response.ok) {
      return { success: false, error: data?.detail || data?.message || data?.error || `Image upload failed (${response.status})` };
    }

    // Try to derive image URL/id from response
    const imageId = data?.image_id ?? data?.id ?? data?.imageId;
    const directUrl = data?.image_url ?? data?.url;
    const imageUrl = directUrl ? String(directUrl) : (imageId ? `${API_BASE_URL}/image/${imageId}` : '');

    return { success: true, data: { imageUrl, raw: data } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error uploading image' };
  }
}

function buildPostPayload(params: {
  title: string;
  description: string;
  userId?: string;
  category: Post['category'];
  subcategory?: string;
  createdAt?: string;
  latitude: number;
  longitude: number;
  photoUri?: string;
  isActive?: boolean;
  videoUri?: string;
}): Record<string, any> {
  const {
    title,
    description,
    userId,
    category,
    subcategory,
    createdAt,
    latitude,
    longitude,
    photoUri,
    isActive,
    videoUri,
  } = params;

  const parsedUserId = Number(userId);

  return {
    title,
    body: description,
    user_id: Number.isFinite(parsedUserId) ? parsedUserId : userId,
    category: toBackendCategory(category),
    subcategory: toBackendSubcategory(category, subcategory) ?? null,
    created_at: createdAt ?? new Date().toISOString(),
    latitude,
    longitude,
    image_url: photoUri ?? null,
    video_url: videoUri ?? null,
    is_active: typeof isActive === 'boolean' ? isActive : true,
  };
}

/**
 * Mock post function for testing without backend
 */
async function mockPostForHelp(postData: PostForHelpData): Promise<ApiResponse<Post>> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock validation
  if (!postData.title || !postData.category || !postData.description) {
    return {
      success: false,
      error: 'All fields are required',
    };
  }

  if (!postData.latitude || !postData.longitude) {
    return {
      success: false,
      error: 'Location is required',
    };
  }

  // Simulate successful post
  const newPost: Post = {
    id: 'post-' + Date.now(),
    title: postData.title,
    category: postData.category,
    subcategory: postData.subcategory,
    description: postData.description,
    latitude: postData.latitude,
    longitude: postData.longitude,
    userId: postData.userId || 'mock-user',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    photoUri: postData.photoUri,
    videoUri: postData.videoUri,
    onMyWayBy: [],
  };

  // Store in mock storage
  mockPostsStorage.push(newPost);

  return {
    success: true,
    data: newPost,
  };
}

/**
 * Post for help - POST request
 * @param postData - Post data including title, category, description, and location
 * @returns Created post data
 */
export async function postForHelp(postData: PostForHelpData): Promise<ApiResponse<Post>> {
  /**
   * CREATE POST
   * 1. POST JSON payload (text + geolocation + optional media URI).
   * 2. If photoUri is a local file (file://), perform multipart upload and patch the resulting post.
   */
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockPostForHelp(postData);
  }

  try {
    const payload = buildPostPayload({
      title: postData.title,
      description: postData.description,
      userId: postData.userId,
      category: postData.category,
      subcategory: postData.subcategory,
      createdAt: new Date().toISOString(),
      latitude: postData.latitude,
      longitude: postData.longitude,
      photoUri: postData.photoUri,
      isActive: true,
      videoUri: postData.videoUri,
    });

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to post',
      };
    }

    let created = normalizePost(data.post || data);

    // Upload image if local URI (starts with file:)
    if (postData.photoUri && /^file:\/\//.test(postData.photoUri)) {
      const uploadResult = await uploadImage(postData.userId || created.userId, created.id, postData.photoUri);
      if (uploadResult.success && uploadResult.data?.imageUrl) {
        // Replace photo URI and optionally refetch
        created.photoUri = uploadResult.data.imageUrl;
      } else {
        console.warn('Image upload failed:', uploadResult.error);
      }
    }

    return { success: true, data: created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Get all posts - GET request
 * @returns List of posts sorted by timestamp (newest first)
 */
export async function getPosts(): Promise<ApiResponse<Post[]>> {
  /**
   * LIST ACTIVE POSTS
   * Uses silent refresh pattern in screens to avoid UX flicker.
   */
  // Use mock API if enabled
  if (USE_MOCK_API) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Return mock posts sorted by timestamp (newest first)
    const sortedPosts = [...mockPostsStorage].sort((a, b) => {
      return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
    });
    
    return {
      success: true,
      data: sortedPosts,
    };
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/posts/active/`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to fetch posts',
      };
    }

    // Sort by timestamp (newest first)
    const possibleCollections = [data?.posts, data?.results, data?.data, data];
    const rawPosts = (possibleCollections.find((collection): collection is any[] => Array.isArray(collection)) ?? []) as any[];
    const posts = rawPosts
      .map((raw) => normalizePost(raw))
      .sort((a: Post, b: Post) => {
        return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
      });

    return {
      success: true,
      data: posts,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

export async function getPost(postId: string): Promise<ApiResponse<Post>> {
  /**
   * FETCH SINGLE POST
   * Normalizes backend fields; merges into context for cached access.
   */
  if (USE_MOCK_API) {
    const found = mockPostsStorage.find((post) => post.id === postId);
    if (!found) {
      return { success: false, error: 'Post not found' };
    }
    return { success: true, data: found };
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to fetch post',
      };
    }

    return {
      success: true,
      data: normalizePost(data.post || data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Mark "On My Way" - Mock implementation
 */
async function mockMarkOnMyWay(postId: string, userId: string): Promise<ApiResponse<Post>> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const post = mockPostsStorage.find((p) => p.id === postId);
  if (!post) {
    return {
      success: false,
      error: 'Post not found',
    };
  }

  // Add user to onMyWayBy array if not already there
  if (!post.onMyWayBy) {
    post.onMyWayBy = [];
  }
  if (!post.onMyWayBy.includes(userId)) {
    post.onMyWayBy.push(userId);
  }

  return {
    success: true,
    data: post,
  };
}

/**
 * Mark post as "On My Way"
 * @param postId - ID of the post
 * @param userId - ID of the user marking "On My Way"
 * @returns Updated post
 */
export async function markOnMyWay(postId: string, userId: string): Promise<ApiResponse<Post>> {
  /**
   * MARK ON MY WAY
   * Adds current user to on_my_way_by collection server-side.
   */
  if (USE_MOCK_API) {
    return mockMarkOnMyWay(postId, userId);
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/on-my-way`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to mark on my way',
      };
    }

    return {
      success: true,
      data: data.post || data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

type ResolvePostData = {
  postId: string;
  userId: string;
  resolutionCode: string;
  resolutionPhotoUri: string;
  resolutionVideoUri?: string;
  postSnapshot: Post;
};

/**
 * Resolve post - Mock implementation
 */
async function mockResolvePost(data: ResolvePostData): Promise<ApiResponse<Post>> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const post = mockPostsStorage.find((p) => p.id === data.postId);
  if (!post) {
    return {
      success: false,
      error: 'Post not found',
    };
  }

  // Mark as resolved
  post.resolvedBy = data.userId;
  post.resolutionCode = data.resolutionCode;
  post.resolutionPhotoUri = data.resolutionPhotoUri;
  post.resolutionVideoUri = data.resolutionVideoUri;
  post.resolvedAt = new Date().toISOString();
  post.is_active = false;

  return {
    success: true,
    data: post,
  };
}

/**
 * Resolve a post
 * @param data - Resolution data including code and media
 * @returns Updated post
 */
export async function resolvePost(data: ResolvePostData): Promise<ApiResponse<Post>> {
  /**
   * RESOLVE POST
   * Requires resolution code + resolution photo.
   * Uploads local image first (if needed), then PUT full post snapshot with resolution metadata.
   */
  if (USE_MOCK_API) {
    return mockResolvePost(data);
  }

  try {
    let resolutionPhotoUri = data.resolutionPhotoUri;
    // Upload resolution image if local
    if (resolutionPhotoUri && /^file:\/\//.test(resolutionPhotoUri)) {
      const uploadResult = await uploadImage(data.userId, data.postId, resolutionPhotoUri);
      if (uploadResult.success && uploadResult.data?.imageUrl) {
        resolutionPhotoUri = uploadResult.data.imageUrl;
      } else {
        console.warn('Resolution image upload failed:', uploadResult.error);
      }
    }

    const payload = buildPostPayload({
      title: data.postSnapshot.title,
      description: data.postSnapshot.description,
      userId: data.postSnapshot.userId ?? data.userId,
      category: data.postSnapshot.category,
      subcategory: data.postSnapshot.subcategory,
      createdAt: data.postSnapshot.createdAt ?? data.postSnapshot.timestamp,
      latitude: data.postSnapshot.latitude,
      longitude: data.postSnapshot.longitude,
      photoUri: resolutionPhotoUri ?? data.postSnapshot.photoUri,
      isActive: false,
      videoUri: data.resolutionVideoUri ?? data.postSnapshot.videoUri,
    });

    const headers = await getAuthHeaders();
    const requestBody = {
      ...payload,
      resolution_code: data.resolutionCode,
      resolved_by: data.userId,
  resolution_photo_url: resolutionPhotoUri,
      resolution_video_url: data.resolutionVideoUri ?? null,
    };
    
    console.log('Resolve Post Request:', {
      url: `${API_BASE_URL}/posts/${data.postId}`,
      headers,
      body: requestBody,
    });
    
    const response = await fetch(`${API_BASE_URL}/posts/${data.postId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    
    console.log('Resolve Post Response:', {
      status: response.status,
      ok: response.ok,
      data: responseData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: responseData.detail || responseData.message || responseData.error || 'Failed to resolve post',
      };
    }

    const normalized = normalizePost(responseData.post || responseData);
    const hydrated: Post = {
      ...data.postSnapshot,
      ...normalized,
      resolvedBy: data.userId,
      resolutionCode: data.resolutionCode,
      resolutionPhotoUri: data.resolutionPhotoUri,
      resolutionVideoUri: data.resolutionVideoUri,
      resolvedAt: new Date().toISOString(),
      is_active: false,
    };

    return {
      success: true,
      data: hydrated,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

