import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import LandingPage from './components/LandingPage';
import { getMockFeedItems } from './services/mockData';
import { apiService } from './services/apiService';
import { FeedItem } from './types';
import logger from './utils/logger';
import { extractUTMParameters, storeUTMParameters } from './utils/sharing';

const LANDING_SEEN_KEY = 'iagram_landing_seen';

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filteredFeedItems, setFilteredFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLanding, setShowLanding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterFeedItems(feedItems, term);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    filterFeedItems(feedItems, '');
  };

  const handleExploreFeed = () => {
    // Mark landing as seen and navigate to feed
    localStorage.setItem(LANDING_SEEN_KEY, 'true');
    setShowLanding(false);

    // Track landing to feed conversion in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'landing_to_feed_conversion', {
        event_category: 'Landing Page',
        event_label: 'User Explored Feed from Landing',
      });
    }
  };

  const handleShowLanding = () => {
    setShowLanding(true);
  };

  const filterFeedItems = (items: FeedItem[], term: string) => {
    if (!term.trim()) {
      setFilteredFeedItems(items);
      return;
    }

    const filtered = items.filter(item =>
      item.iAnfluencer.username.toLowerCase().includes(term.toLowerCase()) ||
      item.iAnfluencer.displayName.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredFeedItems(filtered);
  };

  const fetchFeedData = async (resetPage: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      if (resetPage) {
        setCurrentPage(1);
        setHasMorePosts(true);
      }

      // Try to fetch real data from API
      const feedData = await apiService.getFeedItems(1);

      if (feedData.items.length > 0) {
        setFeedItems(feedData.items);
        setFilteredFeedItems(feedData.items);
        setHasMorePosts(feedData.hasMore);
        setCurrentPage(feedData.currentPage);
        logger.log('✅ Using real API data');
      } else {
        // Fallback to mock data if no real data available
        logger.warn('⚠️ No real data available, using mock data');
        const mockData = getMockFeedItems();
        setFeedItems(mockData);
        setFilteredFeedItems(mockData);
        setHasMorePosts(false);
      }
    } catch (err) {
      // Fallback to mock data if API fails
      logger.warn('⚠️ API failed, falling back to mock data:', err);
      setError('API unavailable - showing sample content');
      const mockData = getMockFeedItems();
      setFeedItems(mockData);
      setFilteredFeedItems(mockData);
      setHasMorePosts(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMorePosts || searchTerm) {
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      const feedData = await apiService.getFeedItems(nextPage);

      if (feedData.items.length > 0) {
        const newFeedItems = [...feedItems, ...feedData.items];
        setFeedItems(newFeedItems);
        setFilteredFeedItems(newFeedItems);
        setCurrentPage(feedData.currentPage);
        setHasMorePosts(feedData.hasMore);
        logger.log(`✅ Loaded page ${nextPage} (${feedData.items.length} posts)`);
      } else {
        setHasMorePosts(false);
        logger.log('📍 Reached end of feed');
      }
    } catch (err) {
      logger.error('❌ Error loading more posts:', err);
      setHasMorePosts(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Detect and store UTM parameters on initial load
  useEffect(() => {
    const utmParams = extractUTMParameters();

    if (utmParams) {
      // Store UTM parameters in sessionStorage for later tracking
      storeUTMParameters(utmParams);

      // Track referred visit in Google Analytics
      if (window.gtag) {
        window.gtag('event', 'referred_visit', {
          source_platform: utmParams.source,
          shared_post_id: utmParams.content.replace('post_', ''),
          ianfluencer: utmParams.term.replace('ianfluencer_', ''),
          referral_type: 'social_share',
          utm_medium: utmParams.medium,
          utm_campaign: utmParams.campaign,
        });
      }

      logger.info('User arrived from shared link:', {
        source: utmParams.source,
        post: utmParams.content,
        ianfluencer: utmParams.term,
      });

      // Clean URL parameters after tracking (optional - provides cleaner URL)
      const url = new URL(window.location.href);
      url.searchParams.delete('utm_source');
      url.searchParams.delete('utm_medium');
      url.searchParams.delete('utm_campaign');
      url.searchParams.delete('utm_content');
      url.searchParams.delete('utm_term');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    // Check if user has seen landing page before
    const hasSeenLanding = localStorage.getItem(LANDING_SEEN_KEY);
    if (!hasSeenLanding) {
      setShowLanding(true);
    }
    fetchFeedData();
  }, []);

  // Re-filter when feedItems change
  useEffect(() => {
    filterFeedItems(feedItems, searchTerm);
  }, [feedItems, searchTerm]);

  // Show landing page if this is first visit
  if (showLanding) {
    return (
      <Layout showHeader={false}>
        <LandingPage
          onExplore={handleExploreFeed}
          samplePosts={loading ? undefined : feedItems.slice(0, 3)}
        />
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout onSearch={handleSearch} searchTerm={searchTerm} onClearSearch={handleClearSearch} onShowLanding={handleShowLanding}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-gray-600">Cargando contenido...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSearch={handleSearch} searchTerm={searchTerm} onClearSearch={handleClearSearch} onShowLanding={handleShowLanding}>
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-4">
          <div className="flex">
            <div className="text-yellow-800">
              <strong>Modo Demo:</strong> {error}
            </div>
          </div>
        </div>
      )}
      <Feed
        feedItems={filteredFeedItems}
        onRefresh={fetchFeedData}
        onClearSearch={handleClearSearch}
        onLoadMore={loadMorePosts}
        loadingMore={loadingMore}
        hasMorePosts={hasMorePosts}
      />
    </Layout>
  );
}

export default App;
