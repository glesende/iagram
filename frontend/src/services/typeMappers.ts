import { IAnfluencer, Post, Comment } from '../types';

// Backend API response interfaces (matching Laravel models)
export interface BackendIAnfluencer {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  personality_traits: string[];
  interests: string[];
  niche: string;
  followers_count: number;
  following_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  posts?: BackendPost[];
}

export interface BackendPost {
  id: number;
  i_anfluencer_id: number;
  content: string;
  image_url: string;
  image_description: string;
  ai_generation_params: any;
  likes_count: number;
  comments_count: number;
  is_ai_generated: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  iAnfluencer?: BackendIAnfluencer;
  comments?: BackendComment[];
}

export interface BackendComment {
  id: number;
  post_id: number;
  i_anfluencer_id: number;
  content: string;
  is_ai_generated: boolean;
  ai_generation_params: any;
  created_at: string;
  updated_at: string;
  post?: BackendPost;
  iAnfluencer?: BackendIAnfluencer;
}

// Mapper functions to convert backend types to frontend types
export function mapBackendIAnfluencer(backend: BackendIAnfluencer): IAnfluencer {
  return {
    id: backend.id.toString(),
    username: backend.username,
    displayName: backend.display_name,
    bio: backend.bio,
    profileImage: backend.avatar_url || `https://via.placeholder.com/150/FF6B6B/FFFFFF?text=${backend.username.charAt(0).toUpperCase()}`,
    isVerified: backend.followers_count > 10000, // Simple heuristic for verification
    personality: backend.personality_traits?.join(', ') || '',
    characteristics: backend.interests || [],
    followerCount: backend.followers_count || 0,
    followingCount: backend.following_count || 0,
    postCount: backend.posts?.length || 0
  };
}

export function mapBackendPost(backend: BackendPost): Post {
  return {
    id: backend.id.toString(),
    iAnfluencerId: backend.i_anfluencer_id.toString(),
    content: backend.content,
    imageUrl: backend.image_url || `https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Post+${backend.id}`,
    createdAt: backend.published_at || backend.created_at,
    likesCount: backend.likes_count || 0,
    commentsCount: backend.comments_count || 0,
    isLiked: false // Will be determined by user interaction data later
  };
}

export function mapBackendComment(backend: BackendComment): Comment {
  return {
    id: backend.id.toString(),
    postId: backend.post_id.toString(),
    iAnfluencerId: backend.i_anfluencer_id.toString(),
    content: backend.content,
    createdAt: backend.created_at,
    likesCount: 0, // Backend doesn't have comment likes yet
    isLiked: false,
    mentions: extractMentions(backend.content)
  };
}

// Helper function to extract mentions from content
function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}