import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import LandingPage from './components/LandingPage';
import IAnfluencerProfile from './components/IAnfluencerProfile';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SavedPostsView from './components/SavedPostsView';
import RegisterReminderModal from './components/RegisterReminderModal';
import EmailVerified from './components/EmailVerified';
import ExploreIAnfluencers from './components/ExploreIAnfluencers';
import { getMockFeedItems } from './services/mockData';
import { apiService } from './services/apiService';
import { FeedItem } from './types';
import logger from './utils/logger';
import { extractUTMParameters, storeUTMParameters } from './utils/sharing';
import { usePostViewCounter } from './hooks/usePostViewCounter';

const LANDING_SEEN_KEY = 'iagram_landing_seen';
const AUTH_TOKEN_KEY = 'iagram_auth_token';
const AUTH_USER_KEY = 'iagram_auth_user';
const ANONYMOUS_INTERACTIONS_KEY = 'iagram_anonymous_interactions';
const REMINDER_SHOWN_COUNT_KEY = 'reminder_shown_count';
const INTERACTION_THRESHOLD = 5;

type View = 'landing' | 'feed' | 'profile' | 'register' | 'login' | 'saved' | 'forgot-password' | 'reset-password' | 'email-verified' | 'explore';

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filteredFeedItems, setFilteredFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('feed');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [anonymousInteractions, setAnonymousInteractions] = useState(0);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Post view counter
  const { viewCount, incrementViewCount } = usePostViewCounter();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterFeedItems(feedItems, term, selectedNiches);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    filterFeedItems(feedItems, '', selectedNiches);
  };

  const handleNicheToggle = (niche: string) => {
    const newSelectedNiches = selectedNiches.includes(niche)
      ? selectedNiches.filter(n => n !== niche)
      : [...selectedNiches, niche];

    setSelectedNiches(newSelectedNiches);
    filterFeedItems(feedItems, searchTerm, newSelectedNiches);

    // Track niche filter in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'niche_filter_toggle', {
        niche: niche,
        action: selectedNiches.includes(niche) ? 'remove' : 'add',
        active_filters: newSelectedNiches.length,
        event_category: 'Filter',
      });
    }
  };

  const handleClearNicheFilters = () => {
    setSelectedNiches([]);
    filterFeedItems(feedItems, searchTerm, []);

    // Track clear filters in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'niche_filters_cleared', {
        event_category: 'Filter',
      });
    }
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

  const migrateLocalFollowsToBackend = async () => {
    try {
      // Look for localStorage keys that start with 'follows_'
      const keysToMigrate: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('follows_') && localStorage.getItem(key) === 'true') {
          const iAnfluencerId = key.replace('follows_', '');
          keysToMigrate.push(iAnfluencerId);
        }
      }

      if (keysToMigrate.length === 0) {
        logger.info('No local follows to migrate');
        return;
      }

      logger.info(`Migrating ${keysToMigrate.length} follows to backend...`);

      // Migrate each follow
      for (const iAnfluencerId of keysToMigrate) {
        try {
          await apiService.followIAnfluencer(iAnfluencerId);
          // Remove from localStorage after successful migration
          localStorage.removeItem(`follows_${iAnfluencerId}`);
          logger.info(`Migrated follow for IAnfluencer ${iAnfluencerId}`);
        } catch (error) {
          logger.error(`Failed to migrate follow for IAnfluencer ${iAnfluencerId}:`, error);
          // Continue with other follows even if one fails
        }
      }

      logger.info('Follow migration completed');
    } catch (error) {
      logger.error('Error during follow migration:', error);
    }
  };

  const handleRegisterSuccess = async (user: any, token: string) => {
    // Store auth data
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    // Migrate local follows to backend
    await migrateLocalFollowsToBackend();

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

  const handleShowForgotPassword = () => {
    setCurrentView('forgot-password');

    // Track forgot password page view in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_forgot_password', {
        event_category: 'Authentication',
      });
    }
  };

  const handleShowResetPassword = () => {
    setCurrentView('reset-password');
  };

  const handleLoginSuccess = async (user: any, token: string) => {
    // Store auth data
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    // Migrate local follows to backend
    await migrateLocalFollowsToBackend();

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

  const handleShowSavedPosts = () => {
    setCurrentView('saved');

    // Track saved posts view in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'navigate_to_saved_posts', {
        event_category: 'Navigation',
      });
    }
  };

  const handleShowExplore = () => {
    setCurrentView('explore');

    // Track explore view in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'navigate_to_explore', {
        event_category: 'Navigation',
      });
    }
  };

  const trackAnonymousInteraction = () => {
    // Don't track if user is already authenticated
    if (authUser) return;

    const newCount = anonymousInteractions + 1;
    setAnonymousInteractions(newCount);
    localStorage.setItem(ANONYMOUS_INTERACTIONS_KEY, newCount.toString());

    // Check if we should show the reminder
    const reminderShownCount = parseInt(localStorage.getItem(REMINDER_SHOWN_COUNT_KEY) || '0');

    // Show reminder at thresholds: 5, 15 (max 2 times per session)
    const shouldShowReminder =
      reminderShownCount < 2 &&
      (newCount === INTERACTION_THRESHOLD || newCount === INTERACTION_THRESHOLD * 3);

    if (shouldShowReminder) {
      setShowReminderModal(true);
      const newReminderCount = reminderShownCount + 1;
      localStorage.setItem(REMINDER_SHOWN_COUNT_KEY, newReminderCount.toString());

      // Track reminder shown in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'register_reminder_shown', {
          anonymous_interactions: newCount,
          session_id: Date.now(),
          event_category: 'Conversion',
        });
      }

      logger.info(`Register reminder shown after ${newCount} interactions (count: ${newReminderCount})`);
    }
  };

  const handleReminderClose = () => {
    setShowReminderModal(false);
  };

  const handleReminderRegister = () => {
    setShowReminderModal(false);
    handleShowRegister();
  };

  const filterFeedItems = (items: FeedItem[], term: string, niches: string[]) => {
    let filtered = items;

    // Apply search term filter
    if (term.trim()) {
      filtered = filtered.filter(item =>
        item.iAnfluencer.username.toLowerCase().includes(term.toLowerCase()) ||
        item.iAnfluencer.displayName.toLowerCase().includes(term.toLowerCase())
      );
    }

    // Apply niche filter
    if (niches.length > 0) {
      filtered = filtered.filter(item =>
        niches.includes(item.iAnfluencer.niche)
      );
    }

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

    // Load anonymous interactions count from localStorage
    const storedInteractions = localStorage.getItem(ANONYMOUS_INTERACTIONS_KEY);
    if (storedInteractions) {
      setAnonymousInteractions(parseInt(storedInteractions));
    }

    // Check if we're on the reset-password URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token') && urlParams.get('email')) {
      setCurrentView('reset-password');
      return;
    }

    // Check if we're on the email-verified URL
    if (urlParams.get('success') === 'true' && window.location.pathname.includes('email-verified')) {
      setCurrentView('email-verified');
      return;
    }

    // Check if user has seen landing page before
    const hasSeenLanding = localStorage.getItem(LANDING_SEEN_KEY);
    if (!hasSeenLanding) {
      setCurrentView('landing');
    }
    fetchFeedData();
  }, []);

  // Re-filter when feedItems, searchTerm, or selectedNiches change
  useEffect(() => {
    filterFeedItems(feedItems, searchTerm, selectedNiches);
  }, [feedItems, searchTerm, selectedNiches]);

  // Calculate available niches from all feed items
  const availableNiches = React.useMemo(() => {
    const niches = new Set<string>();
    feedItems.forEach(item => {
      if (item.iAnfluencer.niche) {
        niches.add(item.iAnfluencer.niche);
      }
    });
    return Array.from(niches).sort();
  }, [feedItems]);

  // Show landing page if this is first visit
  if (currentView === 'landing') {
    return (
      <Layout showHeader={false}>
        <LandingPage
          onExplore={handleExploreFeed}
          onRegister={handleShowRegister}
          onLogin={handleShowLogin}
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
          onGoToForgotPassword={handleShowForgotPassword}
        />
      </Layout>
    );
  }

  // Show forgot password page
  if (currentView === 'forgot-password') {
    return (
      <Layout showHeader={false}>
        <ForgotPassword onBack={handleShowLogin} />
      </Layout>
    );
  }

  // Show reset password page
  if (currentView === 'reset-password') {
    return (
      <Layout showHeader={false}>
        <ResetPassword onBack={handleShowLogin} onGoToForgotPassword={handleShowForgotPassword} />
      </Layout>
    );
  }

  // Show email verified page
  if (currentView === 'email-verified') {
    return (
      <Layout showHeader={false}>
        <EmailVerified onContinue={handleBackToFeed} />
      </Layout>
    );
  }

  // Show profile view
  if (currentView === 'profile' && selectedUsername) {
    return (
      <Layout showHeader={false}>
        <IAnfluencerProfile
          username={selectedUsername}
          onBack={handleBackToFeed}
          onAnonymousInteraction={trackAnonymousInteraction}
          authUser={authUser}
          onShowRegister={handleShowRegister}
        />
        {/* Register Reminder Modal */}
        <RegisterReminderModal
          isOpen={showReminderModal}
          onClose={handleReminderClose}
          onRegister={handleReminderRegister}
          anonymousInteractions={anonymousInteractions}
        />
      </Layout>
    );
  }

  // Show saved posts view
  if (currentView === 'saved') {
    return (
      <Layout showHeader={false}>
        <SavedPostsView onBack={handleBackToFeed} onProfileClick={handleProfileClick} />
      </Layout>
    );
  }

  // Show explore view
  if (currentView === 'explore') {
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
        onShowSavedPosts={handleShowSavedPosts}
        onAnonymousInteraction={trackAnonymousInteraction}
        viewCount={viewCount}
        selectedNiches={selectedNiches}
        onNicheToggle={handleNicheToggle}
        onClearNicheFilters={handleClearNicheFilters}
        availableNiches={availableNiches}
        onShowExplore={handleShowExplore}
      >
        <ExploreIAnfluencers
          authUser={authUser}
          selectedNiches={selectedNiches}
          searchTerm={searchTerm}
          onViewProfile={handleProfileClick}
          onNicheToggle={handleNicheToggle}
          onClearNicheFilters={handleClearNicheFilters}
          onShowRegisterModal={handleShowRegister}
        />
        {/* Register Reminder Modal */}
        <RegisterReminderModal
          isOpen={showReminderModal}
          onClose={handleReminderClose}
          onRegister={handleReminderRegister}
          anonymousInteractions={anonymousInteractions}
        />
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
        onShowSavedPosts={handleShowSavedPosts}
        onAnonymousInteraction={trackAnonymousInteraction}
        viewCount={viewCount}
        selectedNiches={selectedNiches}
        onNicheToggle={handleNicheToggle}
        onClearNicheFilters={handleClearNicheFilters}
        availableNiches={availableNiches}
        onShowExplore={handleShowExplore}
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
      onShowSavedPosts={handleShowSavedPosts}
      onAnonymousInteraction={trackAnonymousInteraction}
      viewCount={viewCount}
      selectedNiches={selectedNiches}
      onNicheToggle={handleNicheToggle}
      onClearNicheFilters={handleClearNicheFilters}
      availableNiches={availableNiches}
      onShowExplore={handleShowExplore}
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
        onAnonymousInteraction={trackAnonymousInteraction}
        authUser={authUser}
        onPostViewed={incrementViewCount}
      />
      {/* Register Reminder Modal */}
      <RegisterReminderModal
        isOpen={showReminderModal}
        onClose={handleReminderClose}
        onRegister={handleReminderRegister}
        anonymousInteractions={anonymousInteractions}
      />
    </Layout>
  );
}

export default App;
