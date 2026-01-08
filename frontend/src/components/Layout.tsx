import React from 'react';
import Header from './Header';
import EmailVerificationBanner from './EmailVerificationBanner';
import { Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
  onShowLanding?: () => void;
  onShowRegister?: () => void;
  onShowLogin?: () => void;
  authUser?: any;
  onLogout?: () => void;
  onShowSavedPosts?: () => void;
  showHeader?: boolean;
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
  onShowUserProfile?: () => void;
  onHashtagSearch?: (hashtag: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  onSearch,
  searchTerm,
  onClearSearch,
  onShowLanding,
  onShowRegister,
  onShowLogin,
  authUser,
  onLogout,
  onShowSavedPosts,
  showHeader = true,
  onAnonymousInteraction,
  viewCount,
  selectedNiches,
  onNicheToggle,
  onClearNicheFilters,
  availableNiches,
  notifications,
  unreadNotificationsCount,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onNotificationClick,
  onShowExplore,
  onShowFeedPreferences,
  onShowUserProfile,
  onHashtagSearch
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <>
          <Header
            onSearch={onSearch}
            searchTerm={searchTerm}
            onClearSearch={onClearSearch}
            onShowLanding={onShowLanding}
            onShowRegister={onShowRegister}
            onShowLogin={onShowLogin}
            authUser={authUser}
            onLogout={onLogout}
            onShowSavedPosts={onShowSavedPosts}
            onAnonymousInteraction={onAnonymousInteraction}
            viewCount={viewCount}
            selectedNiches={selectedNiches}
            onNicheToggle={onNicheToggle}
            onClearNicheFilters={onClearNicheFilters}
            availableNiches={availableNiches}
            notifications={notifications}
            unreadNotificationsCount={unreadNotificationsCount}
            onMarkNotificationAsRead={onMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
            onNotificationClick={onNotificationClick}
            onShowExplore={onShowExplore}
            onShowFeedPreferences={onShowFeedPreferences}
            onShowUserProfile={onShowUserProfile}
            onHashtagSearch={onHashtagSearch}
          />
          <EmailVerificationBanner authUser={authUser} />
        </>
      )}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;