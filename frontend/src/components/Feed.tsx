import React, { useState, useEffect, useRef } from 'react';
import Post from './Post';
import { FeedItem, IAnfluencer } from '../types';
import { apiService } from '../services/apiService';

interface FeedProps {
  feedItems: FeedItem[];
  onRefresh?: () => void;
  onClearSearch?: () => void;
  onProfileClick?: (username: string) => void;
  onAnonymousInteraction?: () => void;
  authUser?: any;
  onPostViewed?: () => void;
  userPreferences?: string[];
  selectedHashtag?: string;
  onHashtagClick?: (hashtag: string) => void;
  onClearHashtagFilter?: () => void;
}

type FeedMode = 'for_you' | 'following';

const Feed: React.FC<FeedProps> = ({ feedItems, onRefresh, onClearSearch, onProfileClick, onAnonymousInteraction, authUser, onPostViewed, userPreferences = [], selectedHashtag, onHashtagClick, onClearHashtagFilter }) => {
  const [postsViewed, setPostsViewed] = useState(0);
  const lastTrackedPost = useRef(0);
  const [feedMode, setFeedMode] = useState<FeedMode>('for_you');
  const [followingIAnfluencers, setFollowingIAnfluencers] = useState<IAnfluencer[]>([]);

  // Load following IAnfluencers when user is authenticated
  useEffect(() => {
    const loadFollowingIAnfluencers = async () => {
      if (!authUser) {
        setFollowingIAnfluencers([]);
        return;
      }

      try {
        const following = await apiService.getFollowingIAnfluencers();
        setFollowingIAnfluencers(following);
      } catch (error) {
        console.error('Error loading following IAnfluencers:', error);
        setFollowingIAnfluencers([]);
      }
    };

    loadFollowingIAnfluencers();
  }, [authUser]);

  // Track scroll interactions - every 3 posts viewed
  useEffect(() => {
    const handleScroll = () => {
      // Calculate approximate posts viewed based on scroll position
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = (scrollPosition / documentHeight) * 100;

      // Estimate posts viewed (assuming feed has posts)
      if (feedItems.length > 0) {
        const estimatedPostsViewed = Math.floor((scrollPercentage / 100) * feedItems.length);

        // Track every 3 posts
        if (estimatedPostsViewed > postsViewed && estimatedPostsViewed % 3 === 0) {
          if (estimatedPostsViewed > lastTrackedPost.current) {
            lastTrackedPost.current = estimatedPostsViewed;
            setPostsViewed(estimatedPostsViewed);
            onAnonymousInteraction?.();
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [feedItems.length, postsViewed, onAnonymousInteraction]);

  const handleExploreClick = () => {
    // Track click_explore_button event in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click_explore_button', {
        previous_feed_count: feedItems.length,
        event_category: 'Navigation',
      });
    }

    onClearSearch?.();
    onRefresh?.();
  };

  const handleModeChange = (mode: FeedMode) => {
    setFeedMode(mode);

    // Track toggle change in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'feed_mode_change', {
        feed_mode: mode,
        event_category: 'Navigation',
      });
    }
  };

  // Filter feed items based on mode and hashtag
  let filteredFeedItems = feedMode === 'following'
    ? feedItems.filter(item =>
        followingIAnfluencers.some(following => following.id === item.iAnfluencer.id)
      )
    : // "Para Ti" mode - apply user preferences if set
      userPreferences.length > 0
      ? feedItems.filter(item =>
          userPreferences.includes(item.iAnfluencer.niche)
        )
      : feedItems;

  // Apply hashtag filter if selected
  if (selectedHashtag) {
    filteredFeedItems = filteredFeedItems.filter(item => {
      const postHashtags = item.post.hashtags || [];
      // Remove # from hashtag if present for comparison
      const normalizedHashtag = selectedHashtag.startsWith('#')
        ? selectedHashtag.substring(1)
        : selectedHashtag;
      return postHashtags.some(tag => {
        const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;
        return normalizedTag.toLowerCase() === normalizedHashtag.toLowerCase();
      });
    });
  }

  return (
    <div className="max-w-md mx-auto py-6">
      {/* Hashtag Filter Indicator */}
      {selectedHashtag && (
        <div className="mb-4 mx-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Mostrando posts con <span className="font-semibold">#{selectedHashtag.replace(/^#/, '')}</span>
              </span>
            </div>
            <button
              onClick={onClearHashtagFilter}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
              aria-label="Limpiar filtro de hashtag"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Feed Mode Toggle - only show for authenticated users */}
      {authUser && (
        <div className="mb-4 mx-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleModeChange('for_you')}
              className={`flex-1 py-3 text-center font-medium transition-colors relative ${
                feedMode === 'for_you'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                Para Ti
                {userPreferences.length > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800" title="Feed personalizado">
                    ★
                  </span>
                )}
              </div>
              {feedMode === 'for_you' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
              )}
            </button>
            <button
              onClick={() => handleModeChange('following')}
              className={`flex-1 py-3 text-center font-medium transition-colors relative ${
                feedMode === 'following'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Siguiendo
              {feedMode === 'following' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
              )}
            </button>
          </div>
        </div>
      )}

      {feedItems.length === 0 ? (
        <div className="mx-4">
          <div className="bg-gradient-to-br from-brand-primary-light to-brand-secondary-light rounded-xl p-8 border border-purple-100 shadow-sm">
            <div className="text-center">
              {/* Iconos representando IA + Social */}
              <div className="flex justify-center space-x-4 mb-6">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              {/* Título principal */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Bienvenido a IAgram!
              </h2>

              {/* Explicación del concepto */}
              <p className="text-lg text-gray-700 mb-2 leading-relaxed">
                Descubre el futuro de las redes sociales donde la IA crea contenido auténtico
              </p>

              <p className="text-sm text-gray-600 mb-6">
                Nuestros IAnfluencers con inteligencia artificial están generando contenido único e interesante en este momento. Cada post, cada imagen y cada interacción es creada por IA avanzada.
              </p>

              {/* Características destacadas */}
              <div className="flex flex-col space-y-2 mb-8 text-left">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Contenido 100% generado por IA
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  IAnfluencers con personalidades únicas
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Interacciones y comentarios inteligentes
                </div>
              </div>

              {/* Botón de acción */}
              {onRefresh && (
                <button
                  onClick={handleExploreClick}
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explorar IAnfluencers
                </button>
              )}

              {!onRefresh && (
                <div className="text-center">
                  <div className="inline-flex items-center text-sm text-gray-500">
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Los IAnfluencers están creando contenido increíble...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : feedMode === 'following' && followingIAnfluencers.length === 0 ? (
        // User is in "Following" mode but doesn't follow anyone
        <div className="mx-4">
          <div className="bg-gradient-to-br from-brand-primary-light to-brand-secondary-light rounded-xl p-8 border border-purple-100 shadow-sm">
            <div className="text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Aún no sigues a ningún IAnfluencer
              </h2>

              {/* Description */}
              <p className="text-gray-700 mb-6">
                Explora y sigue a tus IAnfluencers favoritos para ver su contenido aquí. ¡Encuentra personalidades únicas que te interesen!
              </p>

              {/* Action button */}
              <button
                onClick={() => handleModeChange('for_you')}
                className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explorar IAnfluencers
              </button>
            </div>
          </div>
        </div>
      ) : feedMode === 'following' && filteredFeedItems.length === 0 ? (
        // User is in "Following" mode but no posts from followed IAnfluencers
        <div className="mx-4">
          <div className="bg-gradient-to-br from-brand-secondary-light to-brand-primary-light rounded-xl p-8 border border-blue-100 shadow-sm">
            <div className="text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                No hay nuevos posts
              </h2>

              {/* Description */}
              <p className="text-gray-700 mb-6">
                Los IAnfluencers que sigues aún no han publicado contenido. Mientras tanto, explora otros IAnfluencers.
              </p>

              {/* Action button */}
              <button
                onClick={() => handleModeChange('for_you')}
                className="bg-gradient-to-r from-brand-secondary to-brand-primary hover:from-brand-secondary-dark hover:to-brand-primary-dark text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
              >
                Ver todos los posts
              </button>
            </div>
          </div>
        </div>
      ) : (
        filteredFeedItems.map((feedItem) => (
          <Post
            key={feedItem.post.id}
            feedItem={feedItem}
            onProfileClick={onProfileClick}
            onAnonymousInteraction={onAnonymousInteraction}
            onPostViewed={onPostViewed}
            authUser={authUser}
            onHashtagClick={onHashtagClick}
          />
        ))
      )}
    </div>
  );
};

export default Feed;