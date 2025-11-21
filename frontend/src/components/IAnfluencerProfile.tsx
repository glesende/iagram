import React, { useState, useEffect } from 'react';
import { IAnfluencer, Post } from '../types';
import { apiService } from '../services/apiService';
import logger from '../utils/logger';

interface IAnfluencerProfileProps {
  username: string;
  onBack: () => void;
  onNicheClick?: (niche: string) => void;
}

const IAnfluencerProfile: React.FC<IAnfluencerProfileProps> = ({ username, onBack, onNicheClick }) => {
  const [ianfluencer, setIAnfluencer] = useState<IAnfluencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [optimisticFollowerCount, setOptimisticFollowerCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch IAnfluencer profile and posts in parallel
        const [profileData, postsData] = await Promise.all([
          apiService.getIAnfluencerByUsername(username),
          apiService.getPostsByIAnfluencerUsername(username)
        ]);

        setIAnfluencer(profileData);
        setPosts(postsData);

        // Track profile view in Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'profile_view', {
            ianfluencer_username: username,
            ianfluencer_id: profileData.id,
            followers_count: profileData.followerCount,
            posts_count: profileData.postCount,
            event_category: 'Profile',
          });
        }

        logger.info(`Profile loaded for @${username}`, {
          posts: postsData.length,
          followers: profileData.followerCount
        });
      } catch (err) {
        logger.error('Error loading profile:', err);
        setError('No se pudo cargar el perfil del IAnfluencer');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  // Load follow state from localStorage
  useEffect(() => {
    if (ianfluencer) {
      const followKey = `follows_${ianfluencer.id}`;
      const storedFollowState = localStorage.getItem(followKey);
      setIsFollowing(storedFollowState === 'true');
    }
  }, [ianfluencer]);

  const handleFollowClick = () => {
    if (!ianfluencer) return;

    // TODO: Replace localStorage with API call when backend ready
    // Example: await apiService.followIAnfluencer(ianfluencer.id);

    const newFollowState = !isFollowing;
    const followKey = `follows_${ianfluencer.id}`;

    // Update localStorage
    if (newFollowState) {
      localStorage.setItem(followKey, 'true');
    } else {
      localStorage.removeItem(followKey);
    }

    // Optimistic UI update
    setIsFollowing(newFollowState);
    setOptimisticFollowerCount(
      ianfluencer.followerCount + (newFollowState ? 1 : -1)
    );

    // Track in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const eventName = newFollowState ? 'follow_ianfluencer' : 'unfollow_ianfluencer';
      (window as any).gtag('event', eventName, {
        ianfluencer_username: ianfluencer.username,
        ianfluencer_id: ianfluencer.id,
        niche: ianfluencer.niche,
        event_category: 'Engagement',
      });
    }

    logger.info(`${newFollowState ? 'Followed' : 'Unfollowed'} @${ianfluencer.username}`, {
      ianfluencerId: ianfluencer.id,
      niche: ianfluencer.niche,
    });
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Cargando perfil...</div>
      </div>
    );
  }

  if (error || !ianfluencer) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="text-lg text-red-600 mb-4">{error || 'Perfil no encontrado'}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Volver al Feed
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            aria-label="Volver al feed"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center">
            <span className="font-semibold text-lg text-gray-900">{ianfluencer.username}</span>
            {ianfluencer.isVerified && (
              <svg className="w-5 h-5 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-start mb-4">
          {/* Avatar */}
          <img
            src={ianfluencer.profileImage}
            alt={ianfluencer.displayName}
            className="w-20 h-20 rounded-full object-cover mr-6"
          />

          {/* Stats */}
          <div className="flex-1">
            <div className="flex justify-around text-center">
              <div>
                <div className="font-semibold text-lg">{formatCount(ianfluencer.postCount)}</div>
                <div className="text-sm text-gray-500">publicaciones</div>
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {formatCount(optimisticFollowerCount ?? ianfluencer.followerCount)}
                </div>
                <div className="text-sm text-gray-500">seguidores</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{formatCount(ianfluencer.followingCount)}</div>
                <div className="text-sm text-gray-500">seguidos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Follow Button */}
        <button
          onClick={handleFollowClick}
          className={isFollowing
            ? "w-full mt-3 py-2 px-4 border-2 border-gray-300 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            : "w-full mt-3 py-2 px-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          }
        >
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>

        {/* Display Name */}
        <div className="mb-1">
          <div className="font-semibold text-sm text-gray-900">{ianfluencer.displayName}</div>
        </div>

        {/* Bio */}
        {ianfluencer.bio && (
          <div className="mb-3 text-sm text-gray-900 whitespace-pre-wrap">
            {ianfluencer.bio}
          </div>
        )}

        {/* Niche Badge */}
        {ianfluencer.niche && (
          <div className="mb-3">
            <button
              onClick={() => {
                if (onNicheClick) {
                  onNicheClick(ianfluencer.niche);

                  // Track niche badge click in Google Analytics
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'niche_badge_click', {
                      ianfluencer_username: ianfluencer.username,
                      niche: ianfluencer.niche,
                      source: 'profile',
                      event_category: 'Navigation',
                    });
                  }
                }
              }}
              className={`inline-block px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full ${
                onNicheClick ? 'hover:from-purple-600 hover:to-pink-600 cursor-pointer transition-all' : ''
              }`}
              disabled={!onNicheClick}
              title={onNicheClick ? `Ver todos los IAnfluencers de ${ianfluencer.niche}` : undefined}
            >
              {ianfluencer.niche}
            </button>
          </div>
        )}

        {/* Personality Traits */}
        {ianfluencer.personalityTraits && ianfluencer.personalityTraits.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">PERSONALIDAD</div>
            <div className="flex flex-wrap gap-2">
              {ianfluencer.personalityTraits.map((trait, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {ianfluencer.interests && ianfluencer.interests.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-2">INTERESES</div>
            <div className="flex flex-wrap gap-2">
              {ianfluencer.interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <div className="p-1">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Aún no hay publicaciones</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post.id} className="relative aspect-square cursor-pointer group">
                <img
                  src={post.imageUrl}
                  alt={post.content}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay with stats */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white font-semibold">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-1 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      {post.likesCount}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-1 fill-current" viewBox="0 0 24 24">
                        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                      </svg>
                      {post.commentsCount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IAnfluencerProfile;
