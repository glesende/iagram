import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
  onShowLanding?: () => void;
  onShowSavedPosts?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, searchTerm: externalSearchTerm, onClearSearch, onShowLanding, onShowSavedPosts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [savedPostsCount, setSavedPostsCount] = useState(0);

  // Sync internal state with external searchTerm prop
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // Load saved posts count
  const updateSavedPostsCount = () => {
    try {
      const savedPosts = localStorage.getItem('saved_posts');
      if (savedPosts) {
        const parsedPosts = JSON.parse(savedPosts);
        setSavedPostsCount(parsedPosts.length);
      } else {
        setSavedPostsCount(0);
      }
    } catch (error) {
      setSavedPostsCount(0);
    }
  };

  useEffect(() => {
    updateSavedPostsCount();

    // Listen for changes to saved posts
    const handleSavedPostsChange = () => {
      updateSavedPostsCount();
    };

    window.addEventListener('savedPostsChanged', handleSavedPostsChange);

    return () => {
      window.removeEventListener('savedPostsChanged', handleSavedPostsChange);
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

  const handleSavedPostsClick = () => {
    // Track "Favoritos" button click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_saved_posts_click', {
        saved_posts_count: savedPostsCount,
        event_category: 'Navigation',
        event_label: 'Header Button',
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
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleSavedPostsClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Favoritos"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {savedPostsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {savedPostsCount > 9 ? '9+' : savedPostsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;