import React, { useState, useEffect } from 'react';
import Post from './Post';
import { FeedItem, IAnfluencer } from '../types';
import { apiService } from '../services/apiService';

interface TrendingViewProps {
  onProfileClick?: (username: string) => void;
  onAnonymousInteraction?: () => void;
  authUser?: any;
  selectedNiches?: string[];
}

type TimePeriod = '24h' | 'week' | 'month';

const TrendingView: React.FC<TrendingViewProps> = ({
  onProfileClick,
  onAnonymousInteraction,
  authUser,
  selectedNiches = []
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('24h');
  const [trendingPosts, setTrendingPosts] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load trending posts
  useEffect(() => {
    const loadTrendingPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch trending posts and IAnfluencers in parallel
        const [posts, iAnfluencers, comments] = await Promise.all([
          apiService.getTrendingPosts(selectedPeriod),
          apiService.getIAnfluencers(),
          apiService.getComments()
        ]);

        // Create IAnfluencers map
        const iAnfluencersMapTemp = new Map(iAnfluencers.map(inf => [inf.id, inf]));

        // Group comments by post
        const commentsByPostMap = new Map<string, any[]>();
        comments.forEach(comment => {
          if (!commentsByPostMap.has(comment.postId)) {
            commentsByPostMap.set(comment.postId, []);
          }

          // Resolve author username
          const author = iAnfluencersMapTemp.get(comment.iAnfluencerId);
          const commentWithUsername = {
            ...comment,
            authorUsername: author?.username || `Usuario_${comment.iAnfluencerId}`
          };

          commentsByPostMap.get(comment.postId)!.push(commentWithUsername);
        });

        // Build feed items
        const feedItems = posts.map(post => {
          const iAnfluencer = iAnfluencersMapTemp.get(post.iAnfluencerId);
          const postComments = commentsByPostMap.get(post.id) || [];

          if (!iAnfluencer) {
            return null;
          }

          return {
            post,
            iAnfluencer,
            comments: postComments
          };
        }).filter((item): item is FeedItem => item !== null);

        setTrendingPosts(feedItems);
      } catch (err) {
        console.error('Error loading trending posts:', err);
        setError('Error al cargar posts en tendencia. Por favor intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendingPosts();
  }, [selectedPeriod]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);

    // Track period change in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'trending_period_change', {
        period: period,
        event_category: 'Navigation',
      });
    }
  };

  // Filter by selected niches if any
  const filteredTrendingPosts = selectedNiches.length > 0
    ? trendingPosts.filter(item => selectedNiches.includes(item.iAnfluencer.niche))
    : trendingPosts;

  // Check if a post has high engagement
  const isHighEngagement = (post: FeedItem) => {
    return post.post.likesCount >= 50 || post.post.commentsCount >= 20;
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case '24h': return 'Últimas 24h';
      case 'week': return 'Esta semana';
      case 'month': return 'Este mes';
      default: return 'Últimas 24h';
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      {/* Header with period selector */}
      <div className="mb-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">🔥 Tendencias</h1>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handlePeriodChange('24h')}
            className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors relative ${
              selectedPeriod === '24h'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Últimas 24h
            {selectedPeriod === '24h' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => handlePeriodChange('week')}
            className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors relative ${
              selectedPeriod === 'week'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Esta semana
            {selectedPeriod === 'week' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => handlePeriodChange('month')}
            className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors relative ${
              selectedPeriod === 'month'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Este mes
            {selectedPeriod === 'month' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600"></div>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-3">
          Descubre el contenido más popular de {getPeriodLabel(selectedPeriod).toLowerCase()}
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredTrendingPosts.length === 0 && (
        <div className="mx-4 p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay contenido trending aún
          </h3>
          <p className="text-gray-600 text-sm">
            {selectedNiches.length > 0
              ? 'No se encontraron posts trending en los nichos seleccionados. Intenta cambiar los filtros.'
              : 'No hay posts con suficiente engagement en este período. Vuelve más tarde.'}
          </p>
        </div>
      )}

      {/* Posts list */}
      {!isLoading && !error && filteredTrendingPosts.length > 0 && (
        <div className="space-y-6">
          {filteredTrendingPosts.map((feedItem, index) => (
            <div key={feedItem.post.id} className="relative">
              {/* Trending badge for high engagement posts */}
              {isHighEngagement(feedItem) && (
                <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <span>🔥</span>
                  <span>Trending</span>
                </div>
              )}

              {/* Ranking badge */}
              {index < 3 && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center justify-center w-7 h-7">
                  {index + 1}
                </div>
              )}

              <Post
                feedItem={feedItem}
                onProfileClick={onProfileClick}
                onAnonymousInteraction={onAnonymousInteraction}
                authUser={authUser}
              />

              {/* Engagement metrics */}
              <div className="mx-4 -mt-3 mb-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-500">❤️</span>
                    <span className="font-semibold text-gray-900">{feedItem.post.likesCount}</span>
                    <span className="text-gray-600">likes</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-500">💬</span>
                    <span className="font-semibold text-gray-900">{feedItem.post.commentsCount}</span>
                    <span className="text-gray-600">comentarios</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingView;
