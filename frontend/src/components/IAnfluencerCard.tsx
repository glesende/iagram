import React from 'react';
import { IAnfluencer } from '../types';

interface IAnfluencerCardProps {
  iAnfluencer: IAnfluencer;
  isFollowing: boolean;
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
  onViewProfile: (username: string) => void;
  isAuthenticated: boolean;
}

const nicheLabels: Record<string, string> = {
  'lifestyle': 'Lifestyle',
  'fashion': 'Moda',
  'fitness': 'Fitness',
  'food': 'Comida',
  'travel': 'Viajes',
  'technology': 'Tecnología'
};

const IAnfluencerCard: React.FC<IAnfluencerCardProps> = ({
  iAnfluencer,
  isFollowing,
  onFollow,
  onUnfollow,
  onViewProfile,
  isAuthenticated
}) => {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing) {
      onUnfollow(iAnfluencer.id);
    } else {
      onFollow(iAnfluencer.id);
    }
  };

  const handleCardClick = () => {
    onViewProfile(iAnfluencer.username);
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Truncate bio to 2 lines (approx 100 chars)
  const truncateBio = (bio: string, maxLength: number = 100): string => {
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  };

  return (
    <div
      className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleCardClick}
    >
      {/* Avatar and Username */}
      <div className="flex flex-col items-center mb-4">
        <img
          src={iAnfluencer.profileImage}
          alt={iAnfluencer.username}
          className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-gray-200"
        />
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            @{iAnfluencer.username}
          </h3>
          {iAnfluencer.isVerified && (
            <svg
              className="w-5 h-5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Niche Badge */}
      {iAnfluencer.niche && (
        <div className="flex justify-center mb-3">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            {nicheLabels[iAnfluencer.niche] || iAnfluencer.niche}
          </span>
        </div>
      )}

      {/* Bio */}
      <p className="text-sm text-gray-700 text-center mb-4 min-h-[40px] line-clamp-2">
        {truncateBio(iAnfluencer.bio)}
      </p>

      {/* Stats */}
      <div className="flex justify-center gap-6 mb-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {formatFollowerCount(iAnfluencer.followerCount)}
          </div>
          <div className="text-gray-500">seguidores</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{iAnfluencer.postCount}</div>
          <div className="text-gray-500">posts</div>
        </div>
      </div>

      {/* Follow Button */}
      {isAuthenticated && (
        <button
          onClick={handleFollowClick}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isFollowing
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
          }`}
        >
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
      )}

      {!isAuthenticated && (
        <button
          onClick={handleCardClick}
          className="w-full py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          Ver perfil
        </button>
      )}

      {/* Hover Overlay with Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 hidden group-hover:block">
        {iAnfluencer.interests.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Intereses: </span>
            {iAnfluencer.interests.slice(0, 3).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default IAnfluencerCard;
