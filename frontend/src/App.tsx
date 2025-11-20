import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import LandingPage from './components/LandingPage';
import IAnfluencerProfile from './components/IAnfluencerProfile';
import Register from './components/Register';
import Login from './components/Login';
import { getMockFeedItems } from './services/mockData';
import { apiService } from './services/apiService';
import { FeedItem } from './types';
import logger from './utils/logger';
import { extractUTMParameters, storeUTMParameters } from './utils/sharing';

const LANDING_SEEN_KEY = 'iagram_landing_seen';
const AUTH_TOKEN_KEY = 'iagram_auth_token';
const AUTH_USER_KEY = 'iagram_auth_user';

type View = 'landing' | 'feed' | 'profile' | 'register' | 'login';

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filteredFeedItems, setFilteredFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<View>('feed');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [authToken, setAuthToken] = useState<string | null>(null);

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

  const handleShowRegister = () => {
    setCurrentView('register');

    // Track registration page view in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_registration_form', {
        event_category: 'Authentication',
      });
    }
  };

  const handleRegisterSuccess = (user: any, token: string) => {
    // Store auth data
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    // Navigate to feed
    setCurrentView('feed');

    logger.log('User registered successfully:', user.email);
  };

  const handleShowLogin = () => {
    setCurrentView('login');

    // Track login page view in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_login_form', {
        event_category: 'Authentication',
      });
    }
  };

  const handleLoginSuccess = (user: any, token: string) => {
    // Store auth data
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    // Navigate to feed
    setCurrentView('feed');

    logger.log('User logged in successfully:', user.email);
  };

  const handleLogout = async () => {
    // Call backend logout endpoint to revoke token
    try {
      await apiService.logout();
    } catch (error) {
      logger.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    }

    // Clear auth data
    setAuthUser(null);
    setAuthToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);

    // Track logout in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'logout', {
        event_category: 'Authentication',
      });
    }

    logger.log('User logged out');
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
    // Check for stored auth data
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedToken && storedUser) {
      setAuthToken(storedToken);
      setAuthUser(JSON.parse(storedUser));
    }

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
          onRegister={handleShowRegister}
          samplePosts={loading ? undefined : feedItems.slice(0, 3)}
        />
      </Layout>
    );
  }

  // Show registration page
  if (currentView === 'register') {
    return (
      <Layout showHeader={false}>
        <Register
          onBack={handleShowLanding}
          onRegisterSuccess={handleRegisterSuccess}
        />
      </Layout>
    );
  }

  // Show login page
  if (currentView === 'login') {
    return (
      <Layout showHeader={false}>
        <Login
          onBack={handleShowLanding}
          onLoginSuccess={handleLoginSuccess}
          onGoToRegister={handleShowRegister}
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
      <Layout
        onSearch={handleSearch}
        searchTerm={searchTerm}
        onClearSearch={handleClearSearch}
        onShowLanding={handleShowLanding}
        onShowRegister={handleShowRegister}
        onShowLogin={handleShowLogin}
        authUser={authUser}
        onLogout={handleLogout}
      >
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-gray-600">Cargando contenido...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      onSearch={handleSearch}
      searchTerm={searchTerm}
      onClearSearch={handleClearSearch}
      onShowLanding={handleShowLanding}
      onShowRegister={handleShowRegister}
      onShowLogin={handleShowLogin}
      authUser={authUser}
      onLogout={handleLogout}
    >
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
