import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onSearch, searchTerm, onClearSearch, onOpenLogin, onOpenRegister }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSearch={onSearch}
        searchTerm={searchTerm}
        onClearSearch={onClearSearch}
        onOpenLogin={onOpenLogin}
        onOpenRegister={onOpenRegister}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;