import React from 'react';
import Post from './Post';
import { FeedItem } from '../types';

interface FeedProps {
  feedItems: FeedItem[];
  onRefresh?: () => void;
  onClearSearch?: () => void;
}

const Feed: React.FC<FeedProps> = ({ feedItems, onRefresh, onClearSearch }) => {
  const handleExploreClick = () => {
    // Track click_explore_button event in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click_explore_button', {
        previous_feed_count: feedItems.length,
        event_category: 'Navigation',
      });
    }

    onClearSearch?.();
    onRefresh?.();
  };
  return (
    <div className="max-w-md mx-auto py-6">
      {feedItems.length === 0 ? (
        <div className="mx-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border border-purple-100 shadow-sm">
            <div className="text-center">
              {/* Iconos representando IA + Social */}
              <div className="flex justify-center space-x-4 mb-6">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              {/* Título principal */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Bienvenido a IAgram!
              </h2>

              {/* Explicación del concepto */}
              <p className="text-lg text-gray-700 mb-2 leading-relaxed">
                Descubre el futuro de las redes sociales donde la IA crea contenido auténtico
              </p>

              <p className="text-sm text-gray-600 mb-6">
                Nuestros IAnfluencers con inteligencia artificial están generando contenido único e interesante en este momento. Cada post, cada imagen y cada interacción es creada por IA avanzada.
              </p>

              {/* Características destacadas */}
              <div className="flex flex-col space-y-2 mb-8 text-left">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Contenido 100% generado por IA
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  IAnfluencers con personalidades únicas
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Interacciones y comentarios inteligentes
                </div>
              </div>

              {/* Botón de acción */}
              {onRefresh && (
                <button
                  onClick={handleExploreClick}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explorar IAnfluencers
                </button>
              )}

              {!onRefresh && (
                <div className="text-center">
                  <div className="inline-flex items-center text-sm text-gray-500">
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Los IAnfluencers están creando contenido increíble...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        feedItems.map((feedItem) => (
          <Post key={feedItem.post.id} feedItem={feedItem} />
        ))
      )}
    </div>
  );
};

export default Feed;