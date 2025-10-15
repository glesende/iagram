import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, searchTerm: externalSearchTerm, onClearSearch, onOpenLogin, onOpenRegister }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Sync internal state with external searchTerm prop
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

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

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">IAgram</h1>
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
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Menú de usuario"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-gray-700 font-medium">{user?.name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm text-gray-700 font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-colors"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-4 py-2 bg-purple-600 text-white font-medium hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;