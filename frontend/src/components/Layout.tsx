import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
  onShowLanding?: () => void;
  onShowSavedPosts?: () => void;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, onSearch, searchTerm, onClearSearch, onShowLanding, onShowSavedPosts, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <Header onSearch={onSearch} searchTerm={searchTerm} onClearSearch={onClearSearch} onShowLanding={onShowLanding} onShowSavedPosts={onShowSavedPosts} />
      )}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;