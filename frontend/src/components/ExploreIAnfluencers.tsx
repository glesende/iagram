import React, { useState, useEffect, useCallback } from 'react';
import { IAnfluencer } from '../types';
import apiService from '../services/apiService';
import IAnfluencerCard from './IAnfluencerCard';
import logger from '../utils/logger';

interface ExploreIAnfluencersProps {
  authUser: { id: number; name: string; email: string; email_verified_at: string | null } | null;
  selectedNiches: string[];
  searchTerm: string;
  onViewProfile: (username: string) => void;
  onNicheToggle?: (niche: string) => void;
  onClearNicheFilters?: () => void;
  onShowRegisterModal?: () => void;
}

const nicheLabels: Record<string, string> = {
  'lifestyle': 'Lifestyle',
  'fashion': 'Moda',
  'fitness': 'Fitness',
  'food': 'Comida',
  'travel': 'Viajes',
  'technology': 'Tecnología'
};

const sortOptions = [
  { value: 'followers_desc', label: 'Más seguidores' },
  { value: 'followers_asc', label: 'Menos seguidores' },
  { value: 'posts_desc', label: 'Más posts' },
  { value: 'alphabetical_asc', label: 'A-Z' },
  { value: 'random', label: 'Aleatorio' },
  { value: 'recent', label: 'Recientes' }
];

const ExploreIAnfluencers: React.FC<ExploreIAnfluencersProps> = ({
  authUser,
  selectedNiches,
  searchTerm,
  onViewProfile,
  onNicheToggle,
  onClearNicheFilters,
  onShowRegisterModal
}) => {
  const [iAnfluencers, setIAnfluencers] = useState<IAnfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('followers_desc');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const loadIAnfluencers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getExploreIAnfluencers({
        niche: selectedNiches.length > 0 ? selectedNiches : undefined,
        search: searchTerm || undefined,
        sort_by: sortBy as any,
        per_page: 50
      });

      setIAnfluencers(response.data);

      // Track page view
      if (window.gtag) {
        window.gtag('event', 'view_explore_page', {
          event_category: 'exploration',
          event_label: 'Explore IAnfluencers Page',
          value: response.data.length
        });
      }
    } catch (err) {
      logger.error('Error loading IAnfluencers for explore:', err);
      setError('Error al cargar los IAnfluencers. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [selectedNiches, searchTerm, sortBy]);

  // Load IAnfluencers
  useEffect(() => {
    loadIAnfluencers();
  }, [loadIAnfluencers]);

  // Load following status for authenticated users
  useEffect(() => {
    if (authUser) {
      loadFollowingStatus();
    }
  }, [authUser]);

  const loadFollowingStatus = async () => {
    try {
      const following = await apiService.getFollowingIAnfluencers();
      setFollowingIds(new Set(following.map(inf => inf.id)));
    } catch (err) {
      logger.error('Error loading following status:', err);
    }
  };

  const handleFollow = async (id: string) => {
    // Check if user is authenticated
    if (!authUser) {
      if (onShowRegisterModal) {
        onShowRegisterModal();
      }
      return;
    }

    // Check if email is verified
    if (!authUser.email_verified_at) {
      alert('Por favor verifica tu email para poder seguir IAnfluencers');
      return;
    }

    // Optimistic update
    setFollowingIds(prev => new Set(Array.from(prev).concat(id)));

    // Update follower count optimistically
    setIAnfluencers(prev =>
      prev.map(inf =>
        inf.id === id ? { ...inf, followerCount: inf.followerCount + 1 } : inf
      )
    );

    try {
      const response = await apiService.followIAnfluencer(id);

      // Update with actual count from backend
      setIAnfluencers(prev =>
        prev.map(inf =>
          inf.id === id ? { ...inf, followerCount: response.followers_count } : inf
        )
      );

      // Track follow event
      if (window.gtag) {
        window.gtag('event', 'explore_follow_click', {
          event_category: 'engagement',
          event_label: 'Follow from Explore',
          ianfluencer_id: id
        });
      }
    } catch (err: any) {
      logger.error('Error following IAnfluencer:', err);
      // Revert optimistic update on error
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setIAnfluencers(prev =>
        prev.map(inf =>
          inf.id === id ? { ...inf, followerCount: inf.followerCount - 1 } : inf
        )
      );

      // Check if error is due to email verification
      if (err.message && err.message.includes('verificar')) {
        alert('Por favor verifica tu email para poder seguir IAnfluencers');
      }
    }
  };

  const handleUnfollow = async (id: string) => {
    // Optimistic update
    setFollowingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // Update follower count optimistically
    setIAnfluencers(prev =>
      prev.map(inf =>
        inf.id === id ? { ...inf, followerCount: inf.followerCount - 1 } : inf
      )
    );

    try {
      const response = await apiService.unfollowIAnfluencer(id);

      // Update with actual count from backend
      setIAnfluencers(prev =>
        prev.map(inf =>
          inf.id === id ? { ...inf, followerCount: response.followers_count } : inf
        )
      );

      // Track unfollow event
      if (window.gtag) {
        window.gtag('event', 'explore_unfollow_click', {
          event_category: 'engagement',
          event_label: 'Unfollow from Explore',
          ianfluencer_id: id
        });
      }
    } catch (err) {
      logger.error('Error unfollowing IAnfluencer:', err);
      // Revert optimistic update on error
      setFollowingIds(prev => new Set(Array.from(prev).concat(id)));
      setIAnfluencers(prev =>
        prev.map(inf =>
          inf.id === id ? { ...inf, followerCount: inf.followerCount + 1 } : inf
        )
      );
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);

    // Track sort change
    if (window.gtag) {
      window.gtag('event', 'explore_sort_change', {
        event_category: 'exploration',
        event_label: e.target.value
      });
    }
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-300 rounded-lg p-6 animate-pulse"
          >
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-200 mb-3"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="flex justify-center mb-3">
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
            <div className="flex justify-center gap-6 mb-4">
              <div className="h-10 w-16 bg-gray-200 rounded"></div>
              <div className="h-10 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 py-6 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explorar IAnfluencers
          </h1>
          <p className="text-gray-600">
            Descubre y conecta con {iAnfluencers.length} IAnfluencers increíbles
          </p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
              Ordenar por:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={handleSortChange}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters Display */}
          {(selectedNiches.length > 0 || searchTerm) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Filtros activos:</span>
              {selectedNiches.map(niche => (
                <span
                  key={niche}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center gap-1"
                >
                  {nicheLabels[niche] || niche}
                  {onNicheToggle && (
                    <button
                      onClick={() => onNicheToggle(niche)}
                      className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </span>
              ))}
              {searchTerm && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                  Búsqueda: "{searchTerm}"
                </span>
              )}
              {onClearNicheFilters && (
                <button
                  onClick={onClearNicheFilters}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading && renderLoadingSkeleton()}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadIAnfluencers}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && iAnfluencers.length === 0 && (
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron IAnfluencers
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar tus filtros de búsqueda
            </p>
            {(selectedNiches.length > 0 || searchTerm) && onClearNicheFilters && (
              <button
                onClick={onClearNicheFilters}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && iAnfluencers.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {iAnfluencers.map(ianfluencer => (
              <IAnfluencerCard
                key={ianfluencer.id}
                iAnfluencer={ianfluencer}
                isFollowing={followingIds.has(ianfluencer.id)}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onViewProfile={onViewProfile}
                isAuthenticated={!!authUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreIAnfluencers;
