import React, { useState, useEffect } from 'react';
import { getSavedPostsCount } from '../utils/savedPosts';

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
  onAnonymousInteraction
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedPostsCount, setSavedPostsCount] = useState(0);

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

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">IAgram</h1>
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

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar IAnfluencers..."
                aria-label="Buscar IAnfluencers"
                className="w-48 md:w-64 px-4 py-2 pl-10 pr-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

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
      </div>
    </header>
  );
};

export default Header;