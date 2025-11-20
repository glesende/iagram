import React, { useState, useEffect } from 'react';
import { FeedItem } from '../types';
import { apiService } from '../services/apiService';
import logger from '../utils/logger';
import { generateTrackableShareUrl, getStoredUTMParameters } from '../utils/sharing';

interface PostProps {
  feedItem: FeedItem;
  onProfileClick?: (username: string) => void;
}

const Post: React.FC<PostProps> = ({ feedItem, onProfileClick }) => {
  const { post, iAnfluencer, comments } = feedItem;
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [postComments, setPostComments] = useState(comments);
  const [commentsCount, setCommentsCount] = useState(comments.length);

  // Load like status from API on component mount
  useEffect(() => {
    const loadLikeStatus = async () => {
      try {
        const likeStatus = await apiService.getLikeStatus(post.id.toString());
        setIsLiked(likeStatus.is_liked);
        setLikesCount(likeStatus.likes_count);
      } catch (error) {
        // If API fails, use the values from props as fallback
        logger.warn('Failed to load like status:', error);
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
          const utmParams = getStoredUTMParameters();
          const eventData: any = {
            post_id: post.id,
            ianfluencer_username: iAnfluencer.username,
            event_category: 'Engagement',
          };

          // Add UTM parameters if user came from a shared link
          if (utmParams) {
            eventData.utm_source = utmParams.source;
            eventData.utm_campaign = utmParams.campaign;
            eventData.is_referred_user = true;
          }

          (window as any).gtag('event', 'post_like', eventData);
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
      logger.error('Failed to update like status:', error);
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

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    // Optimistic update - add comment immediately to UI
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      postId: post.id,
      iAnfluencerId: '',
      content: commentText,
      isAiGenerated: false,
      aiGenerationParams: null,
      createdAt: new Date().toISOString(),
      authorUsername: 'Usuario Anónimo'
    };

    setPostComments([...postComments, optimisticComment]);
    setCommentsCount(commentsCount + 1);
    const previousCommentText = commentText;
    setCommentText('');

    try {
      const newComment = await apiService.addComment(post.id, previousCommentText);

      // Replace optimistic comment with actual comment from API
      setPostComments(prevComments =>
        prevComments.map(c => c.id === optimisticComment.id ? newComment : c)
      );

      // Track add_comment event in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        const utmParams = getStoredUTMParameters();
        const eventData: any = {
          post_id: post.id,
          ianfluencer_username: iAnfluencer.username,
          comment_length: previousCommentText.length,
          event_category: 'Engagement',
        };

        if (utmParams) {
          eventData.utm_source = utmParams.source;
          eventData.utm_campaign = utmParams.campaign;
          eventData.is_referred_user = true;
        }

        (window as any).gtag('event', 'add_comment', eventData);
      }

      logger.info('Comment added successfully');
    } catch (error) {
      // Revert optimistic update on error
      setPostComments(postComments);
      setCommentsCount(commentsCount);
      setCommentText(previousCommentText);
      logger.error('Failed to add comment:', error);
      alert('Error al agregar el comentario. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareTitle = '¡Mira este contenido increíble generado 100% por IA en IAgram!';
    const shareText = `🤖 ¡Increíble! Este contenido fue 100% generado por IA. Descubre a los IAnfluencers en IAgram 👉`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        // Use trackable URL for Web Share API
        const trackableUrl = generateTrackableShareUrl(
          post.id.toString(),
          iAnfluencer.username,
          'webshare'
        );

        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: trackableUrl,
        });

        // Track share event in Google Analytics
        if (window.gtag) {
          window.gtag('event', 'share', {
            method: 'webshare',
            content_type: 'post',
            content_id: post.id.toString(),
            ianfluencer_username: iAnfluencer.username,
          });
        }

        logger.info('Post compartido exitosamente vía Web Share API');
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as Error).name !== 'AbortError') {
          logger.error('Error al compartir:', error);
        }
      }
    } else {
      // Fallback: Show share options menu with trackable URLs
      const twitterUrl = generateTrackableShareUrl(
        post.id.toString(),
        iAnfluencer.username,
        'twitter'
      );
      const facebookUrl = generateTrackableShareUrl(
        post.id.toString(),
        iAnfluencer.username,
        'facebook'
      );
      const whatsappUrl = generateTrackableShareUrl(
        post.id.toString(),
        iAnfluencer.username,
        'whatsapp'
      );
      const clipboardUrl = generateTrackableShareUrl(
        post.id.toString(),
        iAnfluencer.username,
        'clipboard'
      );

      const shareOptions = [
        {
          name: 'Twitter',
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(twitterUrl)}`,
        },
        {
          name: 'Facebook',
          url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookUrl)}`,
        },
        {
          name: 'WhatsApp',
          url: `https://wa.me/?text=${encodeURIComponent(`¡Mira qué interesante! Contenido generado completamente por inteligencia artificial en IAgram: ${whatsappUrl}`)}`,
        },
      ];

      // For desktop fallback, copy URL to clipboard and show alert
      try {
        await navigator.clipboard.writeText(clipboardUrl);
        alert(`URL copiada al portapapeles: ${clipboardUrl}\n\nPuedes compartirlo en:\n- Twitter: ${shareOptions[0].url}\n- Facebook: ${shareOptions[1].url}\n- WhatsApp: ${shareOptions[2].url}`);

        // Track share event in Google Analytics
        if (window.gtag) {
          window.gtag('event', 'share', {
            method: 'clipboard',
            content_type: 'post',
            content_id: post.id.toString(),
            ianfluencer_username: iAnfluencer.username,
          });
        }

        logger.info('Post compartido - URL copiada al portapapeles');
      } catch (error) {
        // If clipboard API fails, just log the URLs
        logger.debug('Opciones de compartir:', shareOptions);
        alert(`Comparte este post en:\n${clipboardUrl}`);
      }
    }
  };

  return (
    <article className="bg-white border border-gray-300 rounded-lg mb-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center p-4">
        <button
          onClick={() => onProfileClick?.(iAnfluencer.username)}
          className="flex items-center focus:outline-none"
          aria-label={`Ver perfil de ${iAnfluencer.username}`}
        >
          <img
            src={iAnfluencer.profileImage}
            alt={iAnfluencer.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        </button>
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <button
              onClick={() => onProfileClick?.(iAnfluencer.username)}
              className="font-semibold text-sm text-gray-900 hover:text-gray-600 focus:outline-none"
            >
              {iAnfluencer.username}
            </button>
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
              className={`focus:outline-none relative ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
            <button onClick={() => {
              const newShowComments = !showComments;
              setShowComments(newShowComments);

              // Track view_comments event in Google Analytics when opening comments
              if (newShowComments && typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'view_comments', {
                  post_id: post.id,
                  ianfluencer_username: iAnfluencer.username,
                  comments_count: commentsCount,
                  event_category: 'Engagement',
                });
              }
            }} className="focus:outline-none" aria-label="Ver comentarios">
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button onClick={handleShare} className="focus:outline-none" aria-label="Compartir post">
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
          <button
            onClick={() => onProfileClick?.(iAnfluencer.username)}
            className="font-semibold text-sm text-gray-900 hover:text-gray-600 mr-2 focus:outline-none"
          >
            {iAnfluencer.username}
          </button>
          <span className="text-sm text-gray-900">{post.content}</span>
        </div>

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-gray-500 mb-2 focus:outline-none hover:text-gray-700"
        >
          {showComments
            ? 'Ocultar comentarios'
            : commentsCount > 0
              ? `Ver los ${commentsCount} comentarios`
              : 'Añadir un comentario'}
        </button>

        {/* Comments */}
        {showComments && (
          <div className="space-y-2 mb-3">
            {postComments.slice(0, 10).map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold text-gray-900 mr-2">
                  {comment.authorUsername || `Usuario_${comment.iAnfluencerId}`}
                </span>
                <span className="text-gray-900">{comment.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Input - Always visible when comments section is open */}
        {showComments && (
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-start space-x-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Añade un comentario..."
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                maxLength={500}
                disabled={isSubmittingComment}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  !commentText.trim() || isSubmittingComment
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSubmittingComment ? 'Enviando...' : 'Publicar'}
              </button>
            </div>
            {commentText.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {commentText.length}/500 caracteres
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default Post;