import React, { useState, useEffect } from 'react';
import Post from './Post';
import { getSavedPosts, SavedPost } from '../utils/savedPosts';
import logger from '../utils/logger';

interface SavedPostsViewProps {
  onBack: () => void;
  onProfileClick?: (username: string) => void;
}

const SavedPostsView: React.FC<SavedPostsViewProps> = ({ onBack, onProfileClick }) => {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);

  useEffect(() => {
    loadSavedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track view_saved_posts event when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_saved_posts', {
        saved_posts_count: savedPosts.length,
        event_category: 'Engagement',
      });
    }
  }, [savedPosts.length]);

  const loadSavedPosts = () => {
    const posts = getSavedPosts();
    setSavedPosts(posts);
    logger.log('Loaded saved posts:', posts.length);
  };

  // Refresh saved posts when returning from background or storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'iagram_saved_posts') {
        loadSavedPosts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Refresh saved posts periodically to reflect any changes
  useEffect(() => {
    const interval = setInterval(() => {
      loadSavedPosts();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Volver al feed"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Posts Guardados</h1>
              <p className="text-sm text-gray-500">{savedPosts.length} {savedPosts.length === 1 ? 'post guardado' : 'posts guardados'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {savedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Aún no has guardado ningún post</h2>
            <p className="text-gray-500 text-center max-w-md">
              Cuando guardes posts que te interesen, aparecerán aquí para que puedas revisarlos más tarde.
            </p>
            <button
              onClick={onBack}
              className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Explorar Posts
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {savedPosts.map((savedPost) => (
              <Post
                key={savedPost.postId}
                feedItem={savedPost.feedItem}
                onProfileClick={onProfileClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPostsView;
