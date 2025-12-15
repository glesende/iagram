import { FeedItem } from '../types';
import logger from './logger';

export interface Collection {
  id: string;
  name: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface SavedPost {
  postId: string;
  savedAt: string; // ISO timestamp
  feedItem: FeedItem; // snapshot completo del post
  collectionIds: string[]; // IDs de las colecciones a las que pertenece
}

const SAVED_POSTS_KEY = 'iagram_saved_posts';
const COLLECTIONS_KEY = 'iagram_collections';

/**
 * Migrate saved posts data to include collectionIds if needed
 */
const migrateSavedPostsData = (posts: any[]): SavedPost[] => {
  return posts.map(post => {
    if (!post.collectionIds) {
      return {
        ...post,
        collectionIds: []
      };
    }
    return post as SavedPost;
  });
};

/**
 * Get all saved posts from localStorage
 */
export const getSavedPosts = (): SavedPost[] => {
  try {
    const saved = localStorage.getItem(SAVED_POSTS_KEY);
    if (!saved) return [];
    const posts = JSON.parse(saved);
    const migratedPosts = migrateSavedPostsData(posts);

    // Save migrated data if it was modified
    if (JSON.stringify(posts) !== JSON.stringify(migratedPosts)) {
      localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(migratedPosts));
      logger.log('Saved posts data migrated to include collectionIds');
    }

    return migratedPosts;
  } catch (error) {
    logger.error('Error loading saved posts:', error);
    return [];
  }
};

/**
 * Save a post to favorites with optional collection assignment
 */
export const savePost = (feedItem: FeedItem, collectionIds: string[] = []): boolean => {
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
      collectionIds,
    };

    savedPosts.unshift(newSavedPost); // Add to beginning of array
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPosts));

    logger.log('Post saved successfully:', feedItem.post.id, 'Collections:', collectionIds);
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

// ==================== COLLECTIONS MANAGEMENT ====================

/**
 * Get all collections from localStorage
 */
export const getCollections = (): Collection[] => {
  try {
    const saved = localStorage.getItem(COLLECTIONS_KEY);
    if (!saved) return [];
    return JSON.parse(saved) as Collection[];
  } catch (error) {
    logger.error('Error loading collections:', error);
    return [];
  }
};

/**
 * Create a new collection
 */
export const createCollection = (name: string): Collection | null => {
  try {
    const collections = getCollections();

    // Check if name already exists
    const nameExists = collections.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
      logger.warn('Collection name already exists:', name);
      return null;
    }

    const newCollection: Collection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    collections.push(newCollection);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));

    logger.log('Collection created successfully:', name);
    return newCollection;
  } catch (error) {
    logger.error('Error creating collection:', error);
    return null;
  }
};

/**
 * Update a collection's name
 */
export const updateCollection = (id: string, newName: string): boolean => {
  try {
    const collections = getCollections();
    const collectionIndex = collections.findIndex(c => c.id === id);

    if (collectionIndex === -1) {
      logger.warn('Collection not found:', id);
      return false;
    }

    // Check if new name already exists in other collections
    const nameExists = collections.some(
      c => c.id !== id && c.name.toLowerCase() === newName.toLowerCase()
    );
    if (nameExists) {
      logger.warn('Collection name already exists:', newName);
      return false;
    }

    collections[collectionIndex].name = newName;
    collections[collectionIndex].updatedAt = new Date().toISOString();
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));

    logger.log('Collection updated successfully:', id);
    return true;
  } catch (error) {
    logger.error('Error updating collection:', error);
    return false;
  }
};

/**
 * Delete a collection (removes collection references from all posts)
 */
export const deleteCollection = (id: string): boolean => {
  try {
    const collections = getCollections();
    const filteredCollections = collections.filter(c => c.id !== id);

    if (filteredCollections.length === collections.length) {
      logger.warn('Collection not found:', id);
      return false;
    }

    // Remove this collection from all saved posts
    const savedPosts = getSavedPosts();
    const updatedPosts = savedPosts.map(post => ({
      ...post,
      collectionIds: post.collectionIds.filter(cId => cId !== id)
    }));

    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filteredCollections));
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(updatedPosts));

    logger.log('Collection deleted successfully:', id);
    return true;
  } catch (error) {
    logger.error('Error deleting collection:', error);
    return false;
  }
};

/**
 * Get count of posts in a specific collection
 */
export const getCollectionPostsCount = (collectionId: string): number => {
  try {
    const savedPosts = getSavedPosts();
    return savedPosts.filter(post => post.collectionIds.includes(collectionId)).length;
  } catch (error) {
    logger.error('Error getting collection posts count:', error);
    return 0;
  }
};

/**
 * Get posts filtered by collection
 */
export const getPostsByCollection = (collectionId: string): SavedPost[] => {
  try {
    const savedPosts = getSavedPosts();
    return savedPosts.filter(post => post.collectionIds.includes(collectionId));
  } catch (error) {
    logger.error('Error getting posts by collection:', error);
    return [];
  }
};

/**
 * Add a post to a collection
 */
export const addPostToCollection = (postId: string, collectionId: string): boolean => {
  try {
    const savedPosts = getSavedPosts();
    const postIndex = savedPosts.findIndex(p => p.postId === postId);

    if (postIndex === -1) {
      logger.warn('Saved post not found:', postId);
      return false;
    }

    // Check if already in collection
    if (savedPosts[postIndex].collectionIds.includes(collectionId)) {
      logger.warn('Post already in collection:', postId, collectionId);
      return false;
    }

    savedPosts[postIndex].collectionIds.push(collectionId);
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPosts));

    logger.log('Post added to collection:', postId, collectionId);
    return true;
  } catch (error) {
    logger.error('Error adding post to collection:', error);
    return false;
  }
};

/**
 * Remove a post from a collection
 */
export const removePostFromCollection = (postId: string, collectionId: string): boolean => {
  try {
    const savedPosts = getSavedPosts();
    const postIndex = savedPosts.findIndex(p => p.postId === postId);

    if (postIndex === -1) {
      logger.warn('Saved post not found:', postId);
      return false;
    }

    const initialLength = savedPosts[postIndex].collectionIds.length;
    savedPosts[postIndex].collectionIds = savedPosts[postIndex].collectionIds.filter(
      cId => cId !== collectionId
    );

    if (savedPosts[postIndex].collectionIds.length === initialLength) {
      logger.warn('Post was not in collection:', postId, collectionId);
      return false;
    }

    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPosts));

    logger.log('Post removed from collection:', postId, collectionId);
    return true;
  } catch (error) {
    logger.error('Error removing post from collection:', error);
    return false;
  }
};

/**
 * Update post collections (replace all collections for a post)
 */
export const updatePostCollections = (postId: string, collectionIds: string[]): boolean => {
  try {
    const savedPosts = getSavedPosts();
    const postIndex = savedPosts.findIndex(p => p.postId === postId);

    if (postIndex === -1) {
      logger.warn('Saved post not found:', postId);
      return false;
    }

    savedPosts[postIndex].collectionIds = collectionIds;
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPosts));

    logger.log('Post collections updated:', postId, collectionIds);
    return true;
  } catch (error) {
    logger.error('Error updating post collections:', error);
    return false;
  }
};
