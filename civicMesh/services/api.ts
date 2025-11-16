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

/**
 * Mock login function for testing without backend
 */
async function mockLogin(credentials: LoginCredentials): Promise<ApiResponse<any>> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock validation - accept any email/password for testing
  if (!credentials.email || !credentials.password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  // Simulate successful login
  return {
    success: true,
    data: {
      id: 'mock-user-1',
      email: credentials.email,
      firstName: 'Test',
      lastName: 'User',
    },
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

  // Simulate email already exists error (for testing error handling)
  // Uncomment to test error case:
  // if (signupData.email === 'test@example.com') {
  //   return {
  //     success: false,
  //     error: 'Email already exists',
  //   };
  // }

  // Simulate successful signup
  return {
    success: true,
    data: {
      id: 'mock-user-' + Date.now(),
      email: signupData.email,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
    },
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
};

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

// Mock storage for posts (in-memory, will reset on app restart)
let mockPostsStorage: Post[] = [];

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

