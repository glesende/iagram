import { IAnfluencer, Post, Comment, FeedItem, Notification, NotificationSettings } from '../types';
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
        // Handle 403 Forbidden specifically (likely email not verified)
        if (response.status === 403) {
          const errorData = await response.json().catch(() => null);

          // Check if this is an email verification error
          if (errorData?.error_code === 'EMAIL_NOT_VERIFIED' ||
              errorData?.data?.requires_verification ||
              errorData?.message?.includes('email') ||
              errorData?.message?.includes('verif')) {
            const error = new Error(errorData.message || 'Tu email no ha sido verificado. Por favor verifica tu email para continuar.');
            (error as any).status = 403;
            (error as any).isEmailVerificationError = true;
            (error as any).errorCode = 'EMAIL_NOT_VERIFIED';
            throw error;
          }

          throw new Error(errorData?.message || 'No tienes permisos para realizar esta acción.');
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Log more detailed error information
      if ((error as any).isEmailVerificationError) {
        logger.warn(`Email verification required for ${endpoint}`);
      } else {
        logger.error(`API Error for ${endpoint}:`, error);
      }
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

  // Get IAnfluencers for explore page with filters and sorting
  async getExploreIAnfluencers(params?: {
    niche?: string[];
    verified?: boolean;
    search?: string;
    sort_by?: 'followers_desc' | 'followers_asc' | 'posts_desc' | 'posts_asc' | 'alphabetical_asc' | 'alphabetical_desc' | 'random' | 'recent';
    per_page?: number;
    page?: number;
  }): Promise<{
    data: IAnfluencer[];
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  }> {
    // Build query string
    const queryParams = new URLSearchParams();

    if (params?.niche && params.niche.length > 0) {
      queryParams.append('niche', params.niche.join(','));
    }

    if (params?.verified !== undefined) {
      queryParams.append('verified', params.verified.toString());
    }

    if (params?.search) {
      queryParams.append('search', params.search);
    }

    if (params?.sort_by) {
      queryParams.append('sort_by', params.sort_by);
    }

    if (params?.per_page) {
      queryParams.append('per_page', params.per_page.toString());
    }

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/ianfluencers/explore${queryString ? `?${queryString}` : ''}`;

    const response = await this.fetchJson<PaginatedApiResponse<BackendIAnfluencer>>(endpoint);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch IAnfluencers for explore');
    }

    return {
      data: response.data.data.map(mapBackendIAnfluencer),
      meta: response.data.meta
    };
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

  async getTrendingPosts(period?: '24h' | 'week' | 'month'): Promise<Post[]> {
    const queryParams = period ? `?period=${period}` : '';
    const response = await this.fetchJson<ApiResponse<BackendPost[]>>(`/posts/trending${queryParams}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch trending posts');
    }
    return response.data.map(mapBackendPost);
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

  // Email verification methods
  async resendVerificationEmail(): Promise<void> {
    const response = await this.fetchJson<ApiResponse<void>>('/email/resend', {
      method: 'POST'
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to resend verification email');
    }
  }

  async checkVerificationStatus(): Promise<{ email_verified: boolean; email_verified_at: string | null }> {
    const response = await this.fetchJson<ApiResponse<{ email_verified: boolean; email_verified_at: string | null }>>('/email/verification-status');
    if (!response.success) {
      throw new Error(response.error || 'Failed to check verification status');
    }
    return response.data;
  }

  // Notification methods
  async getNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';

    const response = await this.fetchJson<ApiResponse<Notification[]>>(endpoint);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch notifications');
    }
    return response.data;
  }

  async getUnreadNotificationsCount(): Promise<number> {
    const response = await this.fetchJson<{ success: boolean; unread_count: number }>('/notifications/unread-count');
    if (!response.success) {
      throw new Error('Failed to fetch unread notifications count');
    }
    return response.unread_count;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const response = await this.fetchJson<ApiResponse<void>>(`/notifications/${id}/read`, {
      method: 'POST'
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const response = await this.fetchJson<ApiResponse<void>>('/notifications/read-all', {
      method: 'POST'
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to mark all notifications as read');
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await this.fetchJson<ApiResponse<NotificationSettings>>('/notifications/settings');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch notification settings');
    }
    return response.data;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await this.fetchJson<ApiResponse<NotificationSettings>>('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to update notification settings');
    }
    return response.data;
  }

  // Content preferences methods
  async getContentPreferences(): Promise<{ preferred_niches: string[] }> {
    const response = await this.fetchJson<ApiResponse<{ preferred_niches: string[] }>>('/me/content-preferences');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch content preferences');
    }
    return response.data;
  }

  async updateContentPreferences(preferredNiches: string[]): Promise<{ preferred_niches: string[] }> {
    const response = await this.fetchJson<ApiResponse<{ preferred_niches: string[] }>>('/me/content-preferences', {
      method: 'POST',
      body: JSON.stringify({ preferred_niches: preferredNiches })
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to update content preferences');
    }
    return response.data;
  }

  // User profile methods
  async getUserLikedPosts(): Promise<{ data: Post[]; meta: any }> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendPost>>('/me/liked-posts');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch liked posts');
    }
    return {
      data: response.data.data.map(mapBackendPost),
      meta: response.data.meta
    };
  }

  async getUserComments(): Promise<{ data: Comment[]; meta: any }> {
    const response = await this.fetchJson<PaginatedApiResponse<BackendComment>>('/me/comments');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch user comments');
    }
    return {
      data: response.data.data.map(mapBackendComment),
      meta: response.data.meta
    };
  }

  async getUserStats(): Promise<{
    liked_posts_count: number;
    comments_count: number;
    following_count: number;
    member_since: string;
  }> {
    const response = await this.fetchJson<ApiResponse<{
      liked_posts_count: number;
      comments_count: number;
      following_count: number;
      member_since: string;
    }>>('/me/stats');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch user stats');
    }
    return response.data;
  }

  async updateUserProfile(name: string): Promise<any> {
    const response = await this.fetchJson<ApiResponse<any>>('/me/profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to update profile');
    }
    return response.data;
  }

  async getUserFollowingIAnfluencers(): Promise<IAnfluencer[]> {
    const response = await this.fetchJson<ApiResponse<BackendIAnfluencer[]>>('/me/following-ianfluencers');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch following IAnfluencers');
    }
    return response.data.map(mapBackendIAnfluencer);
  }

  // Email lead capture method
  async submitEmailLead(data: {
    email: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  }): Promise<void> {
    const response = await this.fetchJson<ApiResponse<any>>('/email-leads', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit email lead');
    }
  }
}

export const apiService = new ApiService();
export default apiService;