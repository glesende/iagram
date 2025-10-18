import { IAnfluencer, Post, Comment, FeedItem } from '../types';
import {
  BackendIAnfluencer,
  BackendPost,
  BackendComment,
  mapBackendIAnfluencer,
  mapBackendPost,
  mapBackendComment
} from './typeMappers';
import logger from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data: {
    data: T[];
    links: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
  message: string;
  error?: string;
}

class ApiService {
  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        credentials: 'include', // Send cookies with cross-origin requests for session support
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // IAnfluencers API methods
  async getIAnfluencers(): Promise<IAnfluencer[]> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendIAnfluencer>>('/ianfluencers');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch IAnfluencers');
    }
    return response.data.data.map(mapBackendIAnfluencer);
  }

  async getIAnfluencer(id: string): Promise<IAnfluencer> {
    const response = await this.fetchJson<ApiResponse<BackendIAnfluencer>>(`/ianfluencers/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch IAnfluencer');
    }
    return mapBackendIAnfluencer(response.data);
  }

  // Posts API methods
  async getPosts(): Promise<Post[]> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendPost>>('/posts');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch Posts');
    }
    return response.data.data.map(mapBackendPost);
  }

  async getPost(id: string): Promise<Post> {
    const response = await this.fetchJson<ApiResponse<BackendPost>>(`/posts/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch Post');
    }
    return mapBackendPost(response.data);
  }

  async getPostsByIAnfluencer(iAnfluencerId: string): Promise<Post[]> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendPost>>(`/ianfluencers/${iAnfluencerId}/posts`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch Posts by IAnfluencer');
    }
    return response.data.data.map(mapBackendPost);
  }

  // Comments API methods
  async getComments(): Promise<Comment[]> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendComment>>('/comments');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch Comments');
    }
    return response.data.data.map(mapBackendComment);
  }

  async getComment(id: string): Promise<Comment> {
    const response = await this.fetchJson<ApiResponse<BackendComment>>(`/comments/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch Comment');
    }
    return mapBackendComment(response.data);
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendComment>>(`/posts/${postId}/comments`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch Comments by Post');
    }
    return response.data.data.map(mapBackendComment);
  }

  // Feed API method - combines posts with their related data
  async getFeedItems(page: number = 1): Promise<{
    items: FeedItem[];
    hasMore: boolean;
    currentPage: number;
    lastPage: number;
  }> {
    try {
      // Fetch posts with pagination
      const postsResponse = await this.fetchJson<PaginatedApiResponse<BackendPost>>(`/posts?page=${page}`);

      if (!postsResponse.success) {
        throw new Error(postsResponse.error || 'Failed to fetch Posts');
      }

      const posts = postsResponse.data.data.map(mapBackendPost);
      const { current_page, last_page } = postsResponse.data.meta;

      // Fetch iAnfluencers and comments in parallel
      const [iAnfluencers, comments] = await Promise.all([
        this.getIAnfluencers(),
        this.getComments()
      ]);

      // Create a map for quick lookups
      const iAnfluencersMap = new Map(iAnfluencers.map(inf => [inf.id, inf]));
      const commentsByPostMap = new Map<string, Comment[]>();

      // Group comments by post and resolve author usernames
      comments.forEach(comment => {
        if (!commentsByPostMap.has(comment.postId)) {
          commentsByPostMap.set(comment.postId, []);
        }

        // Resolve author username
        const author = iAnfluencersMap.get(comment.iAnfluencerId);
        const commentWithUsername = {
          ...comment,
          authorUsername: author?.username || `Usuario_${comment.iAnfluencerId}`
        };

        commentsByPostMap.get(comment.postId)!.push(commentWithUsername);
      });

      // Build feed items
      const items = posts.map(post => {
        const iAnfluencer = iAnfluencersMap.get(post.iAnfluencerId);
        const postComments = commentsByPostMap.get(post.id) || [];

        if (!iAnfluencer) {
          logger.warn(`IAnfluencer not found for post ${post.id} with iAnfluencerId ${post.iAnfluencerId}`);
          return null;
        }

        return {
          post,
          iAnfluencer,
          comments: postComments
        };
      }).filter((item): item is FeedItem => item !== null);

      return {
        items,
        hasMore: current_page < last_page,
        currentPage: current_page,
        lastPage: last_page
      };

    } catch (error) {
      logger.error('Error fetching feed items:', error);
      throw error;
    }
  }

  // Like/Unlike posts
  async likePost(postId: string): Promise<{ likes_count: number; is_liked: boolean }> {
    const response = await this.fetchJson<ApiResponse<{ likes_count: number; is_liked: boolean }>>(`/posts/${postId}/like`, {
      method: 'POST'
    });
    return response.data;
  }

  async unlikePost(postId: string): Promise<{ likes_count: number; is_liked: boolean }> {
    const response = await this.fetchJson<ApiResponse<{ likes_count: number; is_liked: boolean }>>(`/posts/${postId}/unlike`, {
      method: 'DELETE'
    });
    return response.data;
  }

  async getLikeStatus(postId: string): Promise<{ likes_count: number; is_liked: boolean }> {
    const response = await this.fetchJson<ApiResponse<{ likes_count: number; is_liked: boolean }>>(`/posts/${postId}/like-status`, {
      method: 'GET'
    });
    return response.data;
  }

  // Like/Unlike comments (future implementation)
  async likeComment(commentId: string): Promise<void> {
    await this.fetchJson(`/comments/${commentId}/like`, {
      method: 'POST'
    });
  }

  async unlikeComment(commentId: string): Promise<void> {
    await this.fetchJson(`/comments/${commentId}/unlike`, {
      method: 'DELETE'
    });
  }
}

export const apiService = new ApiService();
export default apiService;