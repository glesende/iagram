import React, { useState, useEffect } from 'react';
import { FeedItem } from '../types';
import { apiService } from '../services/apiService';

interface PostProps {
  feedItem: FeedItem;
}

const Post: React.FC<PostProps> = ({ feedItem }) => {
  const { post, iAnfluencer, comments } = feedItem;
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load like status from API on component mount
  useEffect(() => {
    const loadLikeStatus = async () => {
      try {
        const likeStatus = await apiService.getLikeStatus(post.id.toString());
        setIsLiked(likeStatus.is_liked);
        setLikesCount(likeStatus.likes_count);
      } catch (error) {
        // If API fails, use the values from props as fallback
        console.warn('Failed to load like status:', error);
      }
    };

    loadLikeStatus();
  }, [post.id]);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    try {
      let result;
      if (newIsLiked) {
        result = await apiService.likePost(post.id.toString());

        // Track like event in Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'post_like', {
            post_id: post.id,
            ianfluencer_username: iAnfluencer.username,
            event_category: 'Engagement',
          });
        }
      } else {
        result = await apiService.unlikePost(post.id.toString());

        // Track unlike event in Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'post_unlike', {
            post_id: post.id,
            ianfluencer_username: iAnfluencer.username,
            event_category: 'Engagement',
          });
        }
      }

      // Update with actual values from API
      setIsLiked(result.is_liked);
      setLikesCount(result.likes_count);
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!newIsLiked);
      setLikesCount(likesCount);
      console.error('Failed to update like status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <article className="bg-white border border-gray-300 rounded-lg mb-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center p-4">
        <img
          src={iAnfluencer.profileImage}
          alt={iAnfluencer.displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <span className="font-semibold text-sm text-gray-900">
              {iAnfluencer.username}
            </span>
            {iAnfluencer.isVerified && (
              <svg className="w-4 h-4 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <title>Verificado</title>
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</span>
        </div>
        <button className="p-1" aria-label="Opciones del post">
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Image */}
      <div className="relative">
        <img
          src={post.imageUrl}
          alt={post.content}
          className="w-full aspect-square object-cover"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`focus:outline-none ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Me gusta"
              aria-pressed={isLiked}
              disabled={isLoading}
            >
              <svg
                className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`}
                fill={isLiked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button onClick={() => {
              const newShowComments = !showComments;
              setShowComments(newShowComments);

              // Track view_comments event in Google Analytics when opening comments
              if (newShowComments && typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'view_comments', {
                  post_id: post.id,
                  ianfluencer_username: iAnfluencer.username,
                  comments_count: comments.length,
                  event_category: 'Engagement',
                });
              }
            }} className="focus:outline-none" aria-label="Ver comentarios">
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Likes count */}
        <div className="mb-2">
          <span className="font-semibold text-sm text-gray-900">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </span>
        </div>

        {/* Caption */}
        <div className="mb-2">
          <span className="font-semibold text-sm text-gray-900 mr-2">
            {iAnfluencer.username}
          </span>
          <span className="text-sm text-gray-900">{post.content}</span>
        </div>

        {/* Comments toggle */}
        {comments.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 mb-2 focus:outline-none"
          >
            {showComments ? 'Ocultar comentarios' : `Ver los ${comments.length} comentarios`}
          </button>
        )}

        {/* Comments */}
        {showComments && (
          <div className="space-y-2">
            {comments.slice(0, 3).map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold text-gray-900 mr-2">
                  {comment.authorUsername || `Usuario_${comment.iAnfluencerId}`}
                </span>
                <span className="text-gray-900">{comment.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export default Post;