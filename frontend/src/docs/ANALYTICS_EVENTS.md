# IAgram Analytics Events Documentation

## Overview
This document describes all analytics events tracked in IAgram for measuring user engagement and growth metrics.

## Analytics Setup
- **Platform**: Google Analytics 4 (GA4)
- **Environment Variable**: `REACT_APP_GA_TRACKING_ID`
- **Service**: `analyticsService.ts`
- **Hooks**: `useAnalytics.ts`

## Event Categories

### 1. Engagement Events

#### Post View (`post_view`)
**Triggered when**: Post becomes 60% visible in viewport
- **Category**: `engagement`
- **Label**: `post_{postId}`
- **Custom Parameters**:
  - `post_id`: String - Unique post identifier
  - `ianfluencer_id`: String - Creator IAnfluencer ID
  - `content_type`: String - Always "ai_generated_post"

#### Post Engagement (`scroll_time` | `full_read`)
**Triggered when**:
- `scroll_time`: Every 1 second of scrolling within post
- `full_read`: User reaches 80% of post content

- **Category**: `post_engagement`
- **Label**: `post_{postId}`
- **Value**: Duration in milliseconds
- **Custom Parameters**:
  - `post_id`: String - Post identifier
  - `engagement_depth`: String - Type of engagement

### 2. Interaction Events

#### Like Click (`like_add` | `like_remove`)
**Triggered when**: User clicks like button
- **Category**: `interaction`
- **Label**: `post_{postId}`
- **Custom Parameters**:
  - `post_id`: String - Post identifier
  - `interaction_type`: String - Always "like"
  - `new_state`: Boolean - True if liked, false if unliked

#### Comment Click (`comment_click`)
**Triggered when**: User expands/collapses comments
- **Category**: `interaction`
- **Label**: `post_{postId}`
- **Custom Parameters**:
  - `post_id`: String - Post identifier
  - `interaction_type`: String - Always "comment_expansion"

### 3. Navigation Events

#### Feed Scroll (`feed_scroll`)
**Triggered when**: User scrolls feed (tracked every 25% milestone)
- **Category**: `navigation`
- **Label**: `scroll_{percentage}%`
- **Value**: Scroll depth percentage (0-100)
- **Custom Parameters**:
  - `scroll_depth`: Number - Percentage scrolled

### 4. IAnfluencer Engagement

#### Profile Interaction (`profile_click` | `posts_view`)
**Triggered when**: User interacts with IAnfluencer profile elements
- **Category**: `ianfluencer_engagement`
- **Label**: `ianfluencer_{iAnfluencerId}`
- **Custom Parameters**:
  - `ianfluencer_id`: String - IAnfluencer identifier
  - `interaction_type`: String - Type of interaction

### 5. Discovery Events

#### Search (`search`)
**Triggered when**: User performs search (future implementation)
- **Category**: `discovery`
- **Label**: Search term
- **Value**: Number of results
- **Custom Parameters**:
  - `search_term`: String - What user searched for
  - `results_count`: Number - Results returned

### 6. Performance Events

#### Load Time (`load_time`)
**Triggered when**: App initialization completes
- **Category**: `performance`
- **Label**: Context (e.g., "app_initialization")
- **Value**: Duration in milliseconds
- **Custom Parameters**:
  - `performance_metric`: String - Type of metric
  - `duration_ms`: Number - Rounded duration
  - `context`: String - Where measurement was taken

#### API Response Time (`api_response_time`)
**Triggered when**: API calls complete
- **Category**: `performance`
- **Label**: Context (e.g., "feed_load", "feed_load_error")
- **Value**: Duration in milliseconds
- **Custom Parameters**:
  - `performance_metric`: String - Always "api_response_time"
  - `duration_ms`: Number - Rounded duration
  - `context`: String - API endpoint context

### 7. Error Events

#### API Error (`api_error`)
**Triggered when**: API calls fail
- **Category**: `errors`
- **Label**: Error message
- **Custom Parameters**:
  - `error_type`: String - Always "api_error"
  - `error_message`: String - Error details
  - `context`: String - Where error occurred
  - `timestamp`: String - ISO timestamp

#### Client Error (`client_error`)
**Triggered when**: Frontend errors occur
- **Category**: `errors`
- **Label**: Error message
- **Custom Parameters**:
  - `error_type`: String - Always "client_error"
  - `error_message`: String - Error details
  - `context`: String - Where error occurred
  - `timestamp`: String - ISO timestamp

### 8. Session Events

#### Session Start (`session_start`)
**Triggered when**: App first loads
- **Category**: `session`
- **Custom Parameters**:
  - `session_id`: String - Unique session identifier
  - `user_agent`: String - Browser user agent
  - `viewport_width`: Number - Screen width
  - `viewport_height`: Number - Screen height

## Key Growth Metrics to Monitor

### Engagement Metrics
1. **Post Views per Session**: Track `post_view` events
2. **Average Time per Post**: Measure `scroll_time` durations
3. **Content Completion Rate**: Compare `post_view` vs `full_read`
4. **Like Rate**: Ratio of `like_add` to `post_view`
5. **Comment Engagement**: `comment_click` frequency

### Content Performance
1. **Top Performing IAnfluencers**: Group by `ianfluencer_id`
2. **Most Engaging Content Types**: Analyze high-engagement posts
3. **Optimal Content Length**: Correlate with `full_read` rates

### User Behavior
1. **Session Duration**: Time between `session_start` and last event
2. **Feed Depth**: Maximum `scroll_depth` reached
3. **Bounce Rate**: Sessions with minimal engagement

### Technical Performance
1. **Load Times**: `load_time` metrics for UX optimization
2. **API Performance**: `api_response_time` trends
3. **Error Rates**: Frequency of error events

## Implementation Notes

### Privacy Considerations
- No personal data is tracked
- User interactions are anonymized
- Compliant with GDPR requirements

### Performance Impact
- Analytics calls are non-blocking
- Events are batched and sent asynchronously
- Minimal overhead on user experience

### Future Enhancements
1. **A/B Testing Events**: Track experiment variations
2. **Conversion Tracking**: Monitor key user actions
3. **Real-time Analytics**: Dashboard for live metrics
4. **Content Attribution**: Track AI model performance

## Configuration

### Environment Variables
```bash
# Required for production
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Development (tracking disabled)
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX  # Use actual ID or disable
```

### Google Analytics 4 Setup
1. Create GA4 property
2. Configure Enhanced Ecommerce (optional)
3. Set up custom dimensions for:
   - `ianfluencer_id`
   - `post_id`
   - `content_type`
   - `interaction_type`

### Debugging
- Use browser developer tools to inspect `dataLayer`
- Check network tab for gtag requests
- Enable GA4 debug mode for real-time validation

## Integration Checklist

- [x] Google Analytics 4 script installed
- [x] Analytics service created
- [x] React hooks implemented
- [x] Post view tracking
- [x] Engagement tracking (likes, comments)
- [x] Scroll tracking
- [x] Performance monitoring
- [x] Error tracking
- [x] Session tracking
- [x] Documentation complete

## Contact
For questions about analytics implementation, reach out to the development team or review the source code in:
- `/src/services/analyticsService.ts`
- `/src/hooks/useAnalytics.ts`