import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import LandingPage from './components/LandingPage';
import IAnfluencerProfile from './components/IAnfluencerProfile';
import { getMockFeedItems } from './services/mockData';
import { apiService } from './services/apiService';
import { FeedItem } from './types';
import logger from './utils/logger';
import { extractUTMParameters, storeUTMParameters } from './utils/sharing';

const LANDING_SEEN_KEY = 'iagram_landing_seen';

type View = 'landing' | 'feed' | 'profile';

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filteredFeedItems, setFilteredFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<View>('feed');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

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
    setCurrentView('feed');

    // Track landing to feed conversion in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'landing_to_feed_conversion', {
        event_category: 'Landing Page',
        event_label: 'User Explored Feed from Landing',
      });
    }
  };

  const handleShowLanding = () => {
    setCurrentView('landing');
  };

  const handleProfileClick = (username: string) => {
    setSelectedUsername(username);
    setCurrentView('profile');

    // Track profile navigation in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'navigate_to_profile', {
        ianfluencer_username: username,
        event_category: 'Navigation',
      });
    }
  };

  const handleBackToFeed = () => {
    setCurrentView('feed');
    setSelectedUsername(null);
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

  const fetchFeedData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch real data from API
      const realFeedItems = await apiService.getFeedItems();

      if (realFeedItems.length > 0) {
        setFeedItems(realFeedItems);
        setFilteredFeedItems(realFeedItems);
        logger.log('✅ Using real API data');
      } else {
        // Fallback to mock data if no real data available
        logger.warn('⚠️ No real data available, using mock data');
        const mockData = getMockFeedItems();
        setFeedItems(mockData);
        setFilteredFeedItems(mockData);
      }
    } catch (err) {
      // Fallback to mock data if API fails
      logger.warn('⚠️ API failed, falling back to mock data:', err);
      setError('API unavailable - showing sample content');
      const mockData = getMockFeedItems();
      setFeedItems(mockData);
      setFilteredFeedItems(mockData);
    } finally {
      setLoading(false);
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
      setCurrentView('landing');
    }
    fetchFeedData();
  }, []);

  // Re-filter when feedItems change
  useEffect(() => {
    filterFeedItems(feedItems, searchTerm);
  }, [feedItems, searchTerm]);

  // Show landing page if this is first visit
  if (currentView === 'landing') {
    return (
      <Layout showHeader={false}>
        <LandingPage
          onExplore={handleExploreFeed}
          samplePosts={loading ? undefined : feedItems.slice(0, 3)}
        />
      </Layout>
    );
  }

  // Show profile view
  if (currentView === 'profile' && selectedUsername) {
    return (
      <Layout showHeader={false}>
        <IAnfluencerProfile username={selectedUsername} onBack={handleBackToFeed} />
      </Layout>
    );
  }

  // Show feed view
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
        onProfileClick={handleProfileClick}
      />
    </Layout>
  );
}

export default App;
