declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

interface TrackingEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: { [key: string]: any };
}

class AnalyticsService {
  private isEnabled: boolean;
  private trackingId: string | null;

  constructor() {
    this.trackingId = process.env.REACT_APP_GA_TRACKING_ID || null;
    this.isEnabled = !!(this.trackingId && this.trackingId !== 'G-XXXXXXXXXX' && typeof window !== 'undefined' && window.gtag);

    if (this.isEnabled) {
      this.initializeAnalytics();
    }
  }

  private initializeAnalytics(): void {
    if (!this.isEnabled || !window.gtag) return;

    // Send initial page view
    this.trackPageView(window.location.pathname);
  }

  // Core tracking methods
  trackPageView(path: string): void {
    if (!this.isEnabled) return;

    window.gtag('config', this.trackingId!, {
      page_path: path,
      send_page_view: true
    });
  }

  trackEvent(event: TrackingEvent): void {
    if (!this.isEnabled) return;

    const eventParams: { [key: string]: any } = {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters
    };

    // Remove undefined values
    Object.keys(eventParams).forEach(key => {
      if (eventParams[key] === undefined) {
        delete eventParams[key];
      }
    });

    window.gtag('event', event.action, eventParams);
  }

  // Specific tracking methods for IAgram

  // Post engagement tracking
  trackPostView(postId: string, iAnfluencerId: string): void {
    this.trackEvent({
      action: 'post_view',
      category: 'engagement',
      label: `post_${postId}`,
      custom_parameters: {
        post_id: postId,
        ianfluencer_id: iAnfluencerId,
        content_type: 'ai_generated_post'
      }
    });
  }

  trackPostEngagement(postId: string, engagementType: 'scroll_time' | 'full_read', duration?: number): void {
    this.trackEvent({
      action: engagementType,
      category: 'post_engagement',
      label: `post_${postId}`,
      value: duration,
      custom_parameters: {
        post_id: postId,
        engagement_depth: engagementType
      }
    });
  }

  // Like tracking
  trackLikeClick(postId: string, isLiked: boolean): void {
    this.trackEvent({
      action: isLiked ? 'like_add' : 'like_remove',
      category: 'interaction',
      label: `post_${postId}`,
      custom_parameters: {
        post_id: postId,
        interaction_type: 'like',
        new_state: isLiked
      }
    });
  }

  // Comment tracking
  trackCommentClick(postId: string): void {
    this.trackEvent({
      action: 'comment_click',
      category: 'interaction',
      label: `post_${postId}`,
      custom_parameters: {
        post_id: postId,
        interaction_type: 'comment_expansion'
      }
    });
  }

  // Navigation tracking
  trackFeedScroll(scrollDepth: number): void {
    if (scrollDepth % 25 === 0) { // Track every 25% of scroll
      this.trackEvent({
        action: 'feed_scroll',
        category: 'navigation',
        label: `scroll_${scrollDepth}%`,
        value: scrollDepth,
        custom_parameters: {
          scroll_depth: scrollDepth
        }
      });
    }
  }

  trackIAnfluencerInteraction(iAnfluencerId: string, interactionType: 'profile_click' | 'posts_view'): void {
    this.trackEvent({
      action: interactionType,
      category: 'ianfluencer_engagement',
      label: `ianfluencer_${iAnfluencerId}`,
      custom_parameters: {
        ianfluencer_id: iAnfluencerId,
        interaction_type: interactionType
      }
    });
  }

  // Search and discovery tracking
  trackSearch(searchTerm: string, resultsCount: number): void {
    this.trackEvent({
      action: 'search',
      category: 'discovery',
      label: searchTerm,
      value: resultsCount,
      custom_parameters: {
        search_term: searchTerm,
        results_count: resultsCount
      }
    });
  }

  // Performance tracking
  trackPerformance(metric: 'load_time' | 'api_response_time', duration: number, context?: string): void {
    this.trackEvent({
      action: metric,
      category: 'performance',
      label: context || 'general',
      value: Math.round(duration),
      custom_parameters: {
        performance_metric: metric,
        duration_ms: Math.round(duration),
        context: context
      }
    });
  }

  // Error tracking
  trackError(errorType: 'api_error' | 'client_error', errorMessage: string, context?: string): void {
    this.trackEvent({
      action: errorType,
      category: 'errors',
      label: errorMessage,
      custom_parameters: {
        error_type: errorType,
        error_message: errorMessage,
        context: context,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Session tracking
  trackSessionStart(): void {
    this.trackEvent({
      action: 'session_start',
      category: 'session',
      custom_parameters: {
        session_id: this.generateSessionId(),
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      }
    });
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Utility methods
  isTrackingEnabled(): boolean {
    return this.isEnabled;
  }

  getTrackingId(): string | null {
    return this.trackingId;
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;

// Export types for use in components
export type { TrackingEvent };