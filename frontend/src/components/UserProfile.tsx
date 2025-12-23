import React, { useState, useEffect } from 'react';
import { Post, Comment, IAnfluencer } from '../types';
import { apiService } from '../services/apiService';
import logger from '../utils/logger';

interface UserProfileProps {
  authUser: any;
  onBack: () => void;
  onProfileClick?: (username: string) => void;
  onShowSavedPosts?: () => void;
}

type TabType = 'activity' | 'comments' | 'following';

const UserProfile: React.FC<UserProfileProps> = ({
  authUser,
  onBack,
  onProfileClick,
  onShowSavedPosts
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [followingIAnfluencers, setFollowingIAnfluencers] = useState<IAnfluencer[]>([]);
  const [stats, setStats] = useState({
    liked_posts_count: 0,
    comments_count: 0,
    following_count: 0,
    member_since: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(authUser?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [activeTab]);

  useEffect(() => {
    // Track profile view in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'user_profile_view', {
        event_category: 'Profile',
        user_id: authUser?.id,
      });
    }
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stats first (always needed)
      const statsData = await apiService.getUserStats();
      setStats(statsData);

      // Load tab-specific data
      if (activeTab === 'activity') {
        const { data: postsData } = await apiService.getUserLikedPosts();
        setLikedPosts(postsData);
      } else if (activeTab === 'comments') {
        const { data: commentsData } = await apiService.getUserComments();
        setUserComments(commentsData);
      } else if (activeTab === 'following') {
        const followingData = await apiService.getUserFollowingIAnfluencers();
        setFollowingIAnfluencers(followingData);
      }

      logger.info('User profile data loaded', { tab: activeTab });
    } catch (err) {
      logger.error('Error loading user profile data:', err);
      setError('No se pudo cargar la información del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    // Track tab change in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'user_profile_tab_change', {
        tab_name: tab,
        event_category: 'Profile',
      });
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;

    setIsSavingName(true);
    try {
      await apiService.updateUserProfile(newName.trim());

      // Update local storage
      const updatedUser = { ...authUser, name: newName.trim() };
      localStorage.setItem('iagram_auth_user', JSON.stringify(updatedUser));

      setIsEditingName(false);

      // Track name update in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'user_profile_name_updated', {
          event_category: 'Profile',
        });
      }

      logger.info('User name updated successfully');
    } catch (err) {
      logger.error('Error updating user name:', err);
      alert('No se pudo actualizar el nombre. Intenta de nuevo.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePostClick = (postId: string) => {
    // For now, just log - could navigate to post detail in future
    logger.info('Post clicked:', postId);
  };

  const handleCommentPostClick = (comment: Comment) => {
    // Navigate to the post (could scroll to it in feed)
    logger.info('Navigate to post from comment:', comment.postId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-purple-600 transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Feed
          </button>

          {/* User Info */}
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {authUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* User Details */}
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tu nombre"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isSavingName ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNewName(authUser?.name || '');
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{authUser?.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                    title="Editar nombre"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-gray-600 mb-2">{authUser?.email}</p>
              <p className="text-sm text-gray-500">
                Miembro desde {formatDate(stats.member_since || authUser?.created_at)}
              </p>
              {authUser?.email_verified_at && (
                <div className="flex items-center mt-2 text-green-600 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Email verificado
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{stats.liked_posts_count}</div>
              <div className="text-sm text-gray-600 mt-1">Posts con Like</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{stats.comments_count}</div>
              <div className="text-sm text-gray-600 mt-1">Comentarios</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
              <div className="text-3xl font-bold text-indigo-600">{stats.following_count}</div>
              <div className="text-sm text-gray-600 mt-1">Siguiendo</div>
            </div>
            {onShowSavedPosts && (
              <button
                onClick={onShowSavedPosts}
                className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl font-bold text-pink-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600 mt-1">Ver Guardados</div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('activity')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Posts con Like
              </div>
            </button>
            <button
              onClick={() => handleTabChange('comments')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comentarios
              </div>
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'following'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Siguiendo
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">Cargando...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                {likedPosts.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Aún no has dado like a ningún post</h3>
                    <p className="text-gray-500">Explora el feed y da like a los posts que te gusten</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {likedPosts.map((post) => (
                      <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">Post #{post.id}</p>
                            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                          </div>
                        </div>
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            className="w-full rounded-lg mb-3"
                          />
                        )}
                        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-5 h-5 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {post.likesCount} likes
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                {userComments.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Aún no has comentado ningún post</h3>
                    <p className="text-gray-500">Interactúa con los posts dejando comentarios</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userComments.map((comment) => (
                      <div key={comment.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {authUser?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-900">{authUser?.name}</p>
                              <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                            </div>
                            <p className="text-gray-800">{comment.content}</p>
                            <button
                              onClick={() => handleCommentPostClick(comment)}
                              className="text-sm text-purple-600 hover:text-purple-700 mt-2"
                            >
                              Ver post original →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div>
                {followingIAnfluencers.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Aún no sigues a ningún IAnfluencer</h3>
                    <p className="text-gray-500">Descubre y sigue IAnfluencers que te interesen</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {followingIAnfluencers.map((ianfluencer) => (
                      <div
                        key={ianfluencer.id}
                        onClick={() => onProfileClick?.(ianfluencer.username)}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {ianfluencer.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">@{ianfluencer.username}</h3>
                            <p className="text-sm text-gray-600 truncate">{ianfluencer.displayName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ianfluencer.bio}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {ianfluencer.followerCount}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {ianfluencer.postCount}
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            {ianfluencer.niche}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
