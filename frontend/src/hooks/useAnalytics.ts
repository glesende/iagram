import { useEffect, useRef, useCallback } from 'react';
import analyticsService from '../services/analyticsService';

interface UseAnalyticsReturn {
  trackEvent: typeof analyticsService.trackEvent;
  trackPostView: typeof analyticsService.trackPostView;
  trackPostEngagement: typeof analyticsService.trackPostEngagement;
  trackLikeClick: typeof analyticsService.trackLikeClick;
  trackCommentClick: typeof analyticsService.trackCommentClick;
  trackFeedScroll: typeof analyticsService.trackFeedScroll;
  trackIAnfluencerInteraction: typeof analyticsService.trackIAnfluencerInteraction;
  isTrackingEnabled: boolean;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  return {
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
    trackPostView: analyticsService.trackPostView.bind(analyticsService),
    trackPostEngagement: analyticsService.trackPostEngagement.bind(analyticsService),
    trackLikeClick: analyticsService.trackLikeClick.bind(analyticsService),
    trackCommentClick: analyticsService.trackCommentClick.bind(analyticsService),
    trackFeedScroll: analyticsService.trackFeedScroll.bind(analyticsService),
    trackIAnfluencerInteraction: analyticsService.trackIAnfluencerInteraction.bind(analyticsService),
    isTrackingEnabled: analyticsService.isTrackingEnabled()
  };
};

// Hook for tracking scroll engagement
export const useScrollTracking = (elementRef: React.RefObject<HTMLElement>, postId?: string) => {
  const lastScrollTime = useRef<number>(0);
  const scrollStartTime = useRef<number | null>(null);
  const hasTrackedFullRead = useRef<boolean>(false);

  const handleScroll = useCallback(() => {
    if (!elementRef.current || !postId) return;

    const element = elementRef.current;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    const currentTime = Date.now();

    // Track scroll start
    if (scrollStartTime.current === null) {
      scrollStartTime.current = currentTime;
    }

    // Calculate scroll percentage
    const scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

    // Track scroll depth milestones
    analyticsService.trackFeedScroll(scrollPercentage);

    // Track time spent scrolling
    if (currentTime - lastScrollTime.current > 1000) { // Every second
      const timeSpent = currentTime - (scrollStartTime.current || currentTime);
      analyticsService.trackPostEngagement(postId, 'scroll_time', timeSpent);
      lastScrollTime.current = currentTime;
    }

    // Track full read (reached 80% of content)
    if (scrollPercentage >= 80 && !hasTrackedFullRead.current) {
      const totalTimeSpent = currentTime - (scrollStartTime.current || currentTime);
      analyticsService.trackPostEngagement(postId, 'full_read', totalTimeSpent);
      hasTrackedFullRead.current = true;
    }
  }, [elementRef, postId]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Reset tracking when postId changes
  useEffect(() => {
    scrollStartTime.current = null;
    hasTrackedFullRead.current = false;
    lastScrollTime.current = 0;
  }, [postId]);
};

// Hook for tracking element visibility
export const useVisibilityTracking = (
  elementRef: React.RefObject<HTMLElement>,
  callback: () => void,
  threshold: number = 0.5
) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            callback();
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [callback, threshold]);
};