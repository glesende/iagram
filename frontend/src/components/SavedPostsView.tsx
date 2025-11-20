import React, { useState, useEffect } from 'react';
import Post from './Post';
import { FeedItem } from '../types';
import logger from '../utils/logger';

interface SavedPost {
  postId: string;
  savedAt: string;
  feedItem: FeedItem;
}

interface SavedPostsViewProps {
  onBack: () => void;
  onProfileClick?: (username: string) => void;
}

const SavedPostsView: React.FC<SavedPostsViewProps> = ({ onBack, onProfileClick }) => {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);

  const loadSavedPosts = () => {
    try {
      const savedPostsData = localStorage.getItem('saved_posts');
      if (savedPostsData) {
        const parsedPosts = JSON.parse(savedPostsData);
        // Sort by savedAt date (most recent first)
        parsedPosts.sort((a: SavedPost, b: SavedPost) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
        setSavedPosts(parsedPosts);
      } else {
        setSavedPosts([]);
      }
    } catch (error) {
      logger.error('Failed to load saved posts:', error);
      setSavedPosts([]);
    }
  };

  useEffect(() => {
    loadSavedPosts();

    // Listen for changes to saved posts
    const handleSavedPostsChange = () => {
      loadSavedPosts();
    };

    window.addEventListener('savedPostsChanged', handleSavedPostsChange);

    return () => {
      window.removeEventListener('savedPostsChanged', handleSavedPostsChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track view_saved_posts event in Google Analytics when savedPosts changes
  useEffect(() => {
    if (savedPosts.length > 0 && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_saved_posts', {
        saved_posts_count: savedPosts.length,
        event_category: 'Navigation',
      });
    }
  }, [savedPosts.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors mr-4"
              aria-label="Volver al feed"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Mis Posts Guardados</h1>
              <p className="text-sm text-gray-500">{savedPosts.length} {savedPosts.length === 1 ? 'post guardado' : 'posts guardados'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto py-6">
        {savedPosts.length === 0 ? (
          <div className="mx-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border border-purple-100 shadow-sm">
              <div className="text-center">
                {/* Bookmark Icon */}
                <div className="flex justify-center mb-6">
                  <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Aún no has guardado ningún post
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-6">
                  Cuando encuentres contenido que te guste y quieras revisar más tarde, toca el ícono de marcador para guardarlo aquí.
                </p>

                {/* Features */}
                <div className="flex flex-col space-y-2 mb-8 text-left">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guarda contenido para verlo más tarde
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Crea tu colección personal de favoritos
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accede a tu contenido guardado en cualquier momento
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={onBack}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explorar Posts
                </button>
              </div>
            </div>
          </div>
        ) : (
          savedPosts.map((savedPost) => (
            <Post
              key={savedPost.postId}
              feedItem={savedPost.feedItem}
              onProfileClick={onProfileClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SavedPostsView;
