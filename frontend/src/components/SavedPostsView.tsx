import React, { useState, useEffect } from 'react';
import Post from './Post';
import {
  getSavedPosts,
  SavedPost,
  getCollections,
  Collection,
  getPostsByCollection,
  getCollectionPostsCount,
} from '../utils/savedPosts';
import logger from '../utils/logger';
import CollectionModal from './CollectionModal';
import SaveToCollectionModal from './SaveToCollectionModal';

interface SavedPostsViewProps {
  onBack: () => void;
  onProfileClick?: (username: string) => void;
}

const SavedPostsView: React.FC<SavedPostsViewProps> = ({ onBack, onProfileClick }) => {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showMoveToCollectionModal, setShowMoveToCollectionModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

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

  const loadCollections = () => {
    const loadedCollections = getCollections();
    setCollections(loadedCollections);
    logger.log('Loaded collections:', loadedCollections.length);
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleCollectionsChange = () => {
    loadCollections();
    loadSavedPosts();
  };

  const displayedPosts = selectedCollectionId
    ? getPostsByCollection(selectedCollectionId)
    : savedPosts;

  const totalPostsCount = savedPosts.length;

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
      {/* Collection Management Modal */}
      <CollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        collections={collections}
        onCollectionsChange={handleCollectionsChange}
      />

      {/* Move to Collection Modal */}
      {selectedPostId && (
        <SaveToCollectionModal
          isOpen={showMoveToCollectionModal}
          onClose={() => {
            setShowMoveToCollectionModal(false);
            setSelectedPostId(null);
          }}
          postId={selectedPostId}
          currentCollectionIds={
            savedPosts.find((sp) => sp.postId === selectedPostId)?.collectionIds || []
          }
          onSave={() => {
            handleCollectionsChange();
          }}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
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
                <p className="text-sm text-gray-500">
                  {selectedCollectionId
                    ? `${displayedPosts.length} posts en esta colección`
                    : `${totalPostsCount} ${totalPostsCount === 1 ? 'post guardado' : 'posts guardados'}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCollectionModal(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Gestionar colecciones"
              title="Gestionar colecciones"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
          </div>

          {/* Collections Navigation Tabs */}
          {(collections.length > 0 || totalPostsCount > 0) && (
            <div className="flex overflow-x-auto pb-3 gap-2 scrollbar-hide">
              {/* All Posts Tab */}
              <button
                onClick={() => setSelectedCollectionId(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCollectionId === null
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Todos ({totalPostsCount})
              </button>

              {/* Collection Tabs */}
              {collections.map((collection) => {
                const count = getCollectionPostsCount(collection.id);
                return (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollectionId(collection.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCollectionId === collection.id
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {collection.name} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {totalPostsCount === 0 ? (
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
        ) : displayedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Esta colección está vacía</h2>
            <p className="text-gray-500 text-center max-w-md">
              No hay posts en esta colección. Guarda posts y añádelos a esta colección para organizarlos.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedPosts.map((savedPost) => (
              <div key={savedPost.postId} className="relative">
                <Post
                  feedItem={savedPost.feedItem}
                  onProfileClick={onProfileClick}
                />
                {/* Collection Indicators */}
                {savedPost.collectionIds.length > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => {
                        setSelectedPostId(savedPost.postId);
                        setShowMoveToCollectionModal(true);
                      }}
                      className="bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md hover:bg-opacity-100 transition-all duration-200 flex items-center gap-1.5"
                      title="Editar colecciones"
                    >
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">
                        {savedPost.collectionIds.length}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPostsView;
