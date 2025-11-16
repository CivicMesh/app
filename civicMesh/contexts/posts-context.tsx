import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getPosts, Post } from '@/services/api';

type PostsContextType = {
  posts: Post[];
  isLoading: boolean;
  refreshPosts: () => Promise<void>;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPosts = async () => {
    try {
      setIsLoading(true);
      const response = await getPosts();
      if (response.success && response.data) {
        // Sort by timestamp (newest first)
        const sortedPosts = [...response.data].sort((a, b) => {
          return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
        });
        setPosts(sortedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPost = (post: Post) => {
    setPosts((prevPosts) => {
      // Add new post at the beginning (newest first)
      const updated = [post, ...prevPosts];
      // Sort to ensure correct order
      return updated.sort((a, b) => {
        return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
      });
    });
  };

  const updatePost = (postId: string, updates: Partial<Post>) => {
    setPosts((prevPosts) => {
      return prevPosts.map((post) => {
        if (post.id === postId) {
          return { ...post, ...updates };
        }
        return post;
      });
    });
  };

  useEffect(() => {
    refreshPosts();
  }, []);

  return (
    <PostsContext.Provider
      value={{
        posts,
        isLoading,
        refreshPosts,
        addPost,
        updatePost,
      }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}

