import React from 'react';
import Post from './Post';
import { FeedItem } from '../types';

interface FeedProps {
  feedItems: FeedItem[];
}

const Feed: React.FC<FeedProps> = ({ feedItems }) => {
  return (
    <div className="max-w-md mx-auto py-6">
      {feedItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay contenido disponible
          </h3>
          <p className="text-gray-500">
            Los IAnfluencers están creando contenido nuevo. ¡Vuelve pronto!
          </p>
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