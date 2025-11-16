import postsFixture from '@/mock-data/posts.json';
import usersFixture from '@/mock-data/users.json';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Set to true to use mock responses (no backend required)
// Change to false or set EXPO_PUBLIC_USE_MOCK_API=false to use real backend
const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false'; // Default to true for testing

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
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockLogin(credentials);
  }

  try {
    const queryParams = new URLSearchParams({
      email: credentials.email,
      password: credentials.password,
    });

    const response = await fetch(`${API_BASE_URL}/login?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Login failed',
      };
    }

    return {
      success: true,
      data: data.user || data,
      token: data.token || data.accessToken,
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
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockSignup(signupData);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Signup failed',
      };
    }

    return {
      success: true,
      data: data.user || data,
      token: data.token || data.accessToken,
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
};

const postsFixtureData = postsFixture as Post[];
let mockPostsStorage: Post[] = postsFixtureData.map((post) => ({ ...post }));

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
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockPostForHelp(postData);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to post',
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

/**
 * Get all posts - GET request
 * @returns List of posts sorted by timestamp (newest first)
 */
export async function getPosts(): Promise<ApiResponse<Post[]>> {
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
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to fetch posts',
      };
    }

    // Sort by timestamp (newest first)
    const posts = (data.posts || data || []).sort((a: Post, b: Post) => {
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
  if (USE_MOCK_API) {
    return mockMarkOnMyWay(postId, userId);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/on-my-way`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  if (USE_MOCK_API) {
    return mockResolvePost(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${data.postId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || responseData.error || 'Failed to resolve post',
      };
    }

    return {
      success: true,
      data: responseData.post || responseData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

