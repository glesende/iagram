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
  private getAuthToken(): string | null {
    return localStorage.getItem('iagram_auth_token');
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    // Build headers with optional Authorization
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with provided headers
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    try {
      const response = await fetch(url, {
        credentials: 'include', // Send cookies with cross-origin requests for session support
        headers,
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

  async getIAnfluencerByUsername(username: string): Promise<IAnfluencer> {
    const response = await this.fetchJson<ApiResponse<BackendIAnfluencer>>(`/ianfluencers/username/${username}`);
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

  async getPostsByIAnfluencerUsername(username: string): Promise<Post[]> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendPost>>(`/posts/influencer/${username}`);
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

  async addComment(postId: string, content: string): Promise<Comment> {
    const response = await this.fetchJson<ApiResponse<BackendComment>>('/comments', {
      method: 'POST',
      body: JSON.stringify({
        post_id: parseInt(postId),
        content: content,
        is_ai_generated: false
      })
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to create comment');
    }
    return mapBackendComment(response.data);
  }

  // Feed API method - combines posts with their related data
  async getFeedItems(): Promise<FeedItem[]> {
    try {
      // Fetch all data in parallel
      const [posts, iAnfluencers, comments] = await Promise.all([
        this.getPosts(),
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
      return posts.map(post => {
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

  // Follow/Unfollow IAnfluencers
  async followIAnfluencer(id: string): Promise<{ success: boolean; followers_count: number }> {
    const response = await this.fetchJson<ApiResponse<{ followers_count: number }>>(`/ianfluencers/${id}/follow`, {
      method: 'POST'
    });
    return {
      success: response.success,
      followers_count: response.data.followers_count
    };
  }

  async unfollowIAnfluencer(id: string): Promise<{ success: boolean; followers_count: number }> {
    const response = await this.fetchJson<ApiResponse<{ followers_count: number }>>(`/ianfluencers/${id}/unfollow`, {
      method: 'DELETE'
    });
    return {
      success: response.success,
      followers_count: response.data.followers_count
    };
  }

  async getFollowStatus(id: string): Promise<{ is_following: boolean }> {
    const response = await this.fetchJson<ApiResponse<{ is_following: boolean }>>(`/ianfluencers/${id}/follow-status`);
    return response.data;
  }

  async getFollowingIAnfluencers(): Promise<IAnfluencer[]> {
    const response = await this.fetchJson<ApiResponse<BackendIAnfluencer[]>>('/me/following');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch following IAnfluencers');
    }
    return response.data.map(mapBackendIAnfluencer);
  }

  // Authentication methods
  async logout(): Promise<void> {
    try {
      await this.fetchJson('/logout', {
        method: 'POST'
      });
    } catch (error) {
      // Even if the API call fails, we should clear local storage
      logger.warn('Logout API call failed, but clearing local auth data anyway:', error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;