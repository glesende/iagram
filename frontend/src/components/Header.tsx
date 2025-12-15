import React, { useState, useEffect } from 'react';
import { getSavedPostsCount } from '../utils/savedPosts';
import ViewCounter from './ViewCounter';
import NotificationPanel from './NotificationPanel';
import { Notification } from '../types';
import { isEmailVerified } from '../utils/emailVerification';
import { apiService } from '../services/apiService';

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
  onShowLanding?: () => void;
  onShowRegister?: () => void;
  onShowLogin?: () => void;
  authUser?: any;
  onLogout?: () => void;
  onShowSavedPosts?: () => void;
  onAnonymousInteraction?: () => void;
  viewCount?: number;
  selectedNiches?: string[];
  onNicheToggle?: (niche: string) => void;
  onClearNicheFilters?: () => void;
  availableNiches?: string[];
  notifications?: Notification[];
  unreadNotificationsCount?: number;
  onMarkNotificationAsRead?: (id: number) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onShowExplore?: () => void;
  onShowFeedPreferences?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchTerm: externalSearchTerm,
  onClearSearch,
  onShowLanding,
  onShowRegister,
  onShowLogin,
  authUser,
  onLogout,
  onShowSavedPosts,
  onAnonymousInteraction,
  viewCount = 0,
  selectedNiches = [],
  onNicheToggle,
  onClearNicheFilters,
  availableNiches = [],
  notifications = [],
  unreadNotificationsCount = 0,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onNotificationClick,
  onShowExplore,
  onShowFeedPreferences
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedPostsCount, setSavedPostsCount] = useState(0);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Sync internal state with external searchTerm prop
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // Update saved posts count
  useEffect(() => {
    const updateCount = () => {
      setSavedPostsCount(getSavedPostsCount());
    };

    // Update count on mount
    updateCount();

    // Update count when localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'iagram_saved_posts') {
        updateCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for changes every second (for same-tab updates)
    const interval = setInterval(updateCount, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);

    // Track search event in Google Analytics when user types
    if (value && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'search', {
        search_term: value,
        event_category: 'Search',
      });
    }

    // Track anonymous interaction on search
    if (value.length >= 3) {
      onAnonymousInteraction?.();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  const handleLandingClick = () => {
    // Track "What is IAgram" button click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'what_is_iagram_click', {
        event_category: 'Navigation',
        event_label: 'Header Button',
      });
    }
    onShowLanding?.();
  };

  const handleRegisterClick = () => {
    // Track registration button click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'header_register_click', {
        event_category: 'Navigation',
        event_label: 'Header Register Button',
      });
    }
    onShowRegister?.();
  };

  const handleLoginClick = () => {
    // Track login button click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'header_login_click', {
        event_category: 'Navigation',
        event_label: 'Header Login Button',
      });
    }
    onShowLogin?.();
  };

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    onLogout?.();
  };

  const handleSavedPostsClick = () => {
    // Track favoritos button click in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'header_favoritos_click', {
        event_category: 'Navigation',
        event_label: 'Header Favoritos Button',
        saved_posts_count: savedPostsCount,
      });
    }
    onShowSavedPosts?.();
  };

  const handleNicheClick = (niche: string) => {
    onNicheToggle?.(niche);

    // Track anonymous interaction on niche filter
    onAnonymousInteraction?.();
  };

  const handleExploreClick = () => {
    // Track explore button click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'header_explore_click', {
        event_category: 'Navigation',
        event_label: 'Header Explore Button',
      });
    }
    onShowExplore?.();
  };

  const handleResendVerificationEmail = async () => {
    setIsResendingEmail(true);

    try {
      await apiService.resendVerificationEmail();

      // Track resend email event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'header_resend_verification_email', {
          event_category: 'Email Verification',
        });
      }

      alert('Email de verificación reenviado. Por favor revisa tu bandeja de entrada.');
    } catch (error) {
      console.error('Error al reenviar email:', error);
      alert('No se pudo reenviar el email. Por favor, intenta de nuevo.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Define niche labels with emojis for better UX
  const nicheLabels: Record<string, string> = {
    'lifestyle': 'Lifestyle',
    'fashion': 'Moda',
    'fitness': 'Fitness',
    'food': 'Comida',
    'travel': 'Viajes',
    'technology': 'Tecnología'
  };

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
      {/* Email Verification Banner - Show for unverified users */}
      {authUser && !isEmailVerified(authUser) && showBanner && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Por favor verifica tu email para poder interactuar con el contenido
                  </p>
                  <p className="text-xs mt-0.5 opacity-90">
                    Revisa tu bandeja de entrada en {authUser.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={handleResendVerificationEmail}
                  disabled={isResendingEmail}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                    isResendingEmail
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-white/90 hover:bg-white text-orange-600 hover:text-orange-700'
                  }`}
                >
                  {isResendingEmail ? 'Enviando...' : 'Reenviar email'}
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Cerrar banner"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">IAgram</h1>
            <div className="flex items-center space-x-2">
              {onShowExplore && (
                <button
                  onClick={handleExploreClick}
                  className="hidden sm:flex items-center text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-3 py-1.5 rounded-lg transition-all"
                  aria-label="Explorar IAnfluencers"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explorar
                </button>
              )}
              {onShowLanding && (
                <button
                  onClick={handleLandingClick}
                  className="hidden sm:flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  aria-label="¿Qué es IAgram?"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ¿Qué es IAgram?
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar IAnfluencers..."
                aria-label="Buscar IAnfluencers"
                className="w-48 md:w-64 px-4 py-2 pl-10 pr-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* View Counter */}
            <ViewCounter count={viewCount} />

            {/* Favoritos button */}
            {onShowSavedPosts && (
              <button
                onClick={handleSavedPostsClick}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Ver posts guardados"
                title="Favoritos"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {savedPostsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {savedPostsCount > 9 ? '9+' : savedPostsCount}
                  </span>
                )}
              </button>
            )}

            {/* Feed Preferences button - only show for authenticated users */}
            {authUser && onShowFeedPreferences && (
              <button
                onClick={onShowFeedPreferences}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Personalizar feed"
                title="Personalizar Feed"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            )}

            {/* Notifications button - only show for authenticated users */}
            {authUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Ver notificaciones"
                  title="Notificaciones"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notification panel */}
                {showNotifications && onMarkNotificationAsRead && onMarkAllNotificationsAsRead && onNotificationClick && (
                  <NotificationPanel
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkAsRead={onMarkNotificationAsRead}
                    onMarkAllAsRead={onMarkAllNotificationsAsRead}
                    onNotificationClick={(notification) => {
                      setShowNotifications(false);
                      onNotificationClick(notification);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {authUser ? (
              // Authenticated user menu
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {authUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{authUser.name}</p>
                      <p className="text-xs text-gray-500 truncate">{authUser.email}</p>
                    </div>
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Not authenticated - show login and register buttons
              <div className="flex items-center space-x-2">
                {onShowLogin && (
                  <button
                    onClick={handleLoginClick}
                    className="text-gray-700 hover:text-purple-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm"
                  >
                    Iniciar Sesión
                  </button>
                )}
                {onShowRegister && (
                  <button
                    onClick={handleRegisterClick}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                  >
                    Crear Cuenta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Niche Filter Chips */}
        {availableNiches.length > 0 && (
          <div className="py-3 border-t border-gray-200">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Clear filters button */}
              {selectedNiches.length > 0 && (
                <button
                  onClick={onClearNicheFilters}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-1"
                  aria-label="Limpiar filtros"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar
                </button>
              )}

              {/* Niche chips */}
              {availableNiches.map((niche) => {
                const isSelected = selectedNiches.includes(niche);
                return (
                  <button
                    key={niche}
                    onClick={() => handleNicheClick(niche)}
                    className={`flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 transform hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label={`Filtrar por ${nicheLabels[niche] || niche}`}
                    aria-pressed={isSelected}
                  >
                    {nicheLabels[niche] || niche}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;