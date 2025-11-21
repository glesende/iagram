import { FeedItem } from '../types';
import logger from './logger';

export interface SavedPost {
  postId: string;
  savedAt: string; // ISO timestamp
  feedItem: FeedItem; // snapshot completo del post
}

const SAVED_POSTS_KEY = 'iagram_saved_posts';

/**
 * Get all saved posts from localStorage
 */
export const getSavedPosts = (): SavedPost[] => {
  try {
    const saved = localStorage.getItem(SAVED_POSTS_KEY);
    if (!saved) return [];
    return JSON.parse(saved) as SavedPost[];
  } catch (error) {
    logger.error('Error loading saved posts:', error);
    return [];
  }
};

/**
 * Save a post to favorites
 */
export const savePost = (feedItem: FeedItem): boolean => {
  try {
    const savedPosts = getSavedPosts();

    // Check if already saved
    const alreadySaved = savedPosts.some(sp => sp.postId === feedItem.post.id);
    if (alreadySaved) {
      logger.warn('Post already saved:', feedItem.post.id);
      return false;
    }

    // Add new saved post
    const newSavedPost: SavedPost = {
      postId: feedItem.post.id,
      savedAt: new Date().toISOString(),
      feedItem,
    };

    savedPosts.unshift(newSavedPost); // Add to beginning of array
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPosts));

    logger.log('Post saved successfully:', feedItem.post.id);
    return true;
  } catch (error) {
    logger.error('Error saving post:', error);
    return false;
  }
};

/**
 * Remove a post from favorites
 */
export const unsavePost = (postId: string): boolean => {
  try {
    const savedPosts = getSavedPosts();
    const filteredPosts = savedPosts.filter(sp => sp.postId !== postId);

    if (filteredPosts.length === savedPosts.length) {
      logger.warn('Post was not saved:', postId);
      return false;
    }

    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(filteredPosts));
    logger.log('Post unsaved successfully:', postId);
    return true;
  } catch (error) {
    logger.error('Error unsaving post:', error);
    return false;
  }
};

/**
 * Check if a post is saved
 */
export const isPostSaved = (postId: string): boolean => {
  try {
    const savedPosts = getSavedPosts();
    return savedPosts.some(sp => sp.postId === postId);
  } catch (error) {
    logger.error('Error checking if post is saved:', error);
    return false;
  }
};

/**
 * Get count of saved posts
 */
export const getSavedPostsCount = (): number => {
  try {
    return getSavedPosts().length;
  } catch (error) {
    logger.error('Error getting saved posts count:', error);
    return 0;
  }
};

/**
 * Clear all saved posts
 */
export const clearSavedPosts = (): void => {
  try {
    localStorage.removeItem(SAVED_POSTS_KEY);
    logger.log('All saved posts cleared');
  } catch (error) {
    logger.error('Error clearing saved posts:', error);
  }
};
