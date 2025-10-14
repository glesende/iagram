import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import { getMockFeedItems } from './services/mockData';
import { apiService } from './services/apiService';
import { FeedItem } from './types';
import logger from './utils/logger';

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filteredFeedItems, setFilteredFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterFeedItems(feedItems, term);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    filterFeedItems(feedItems, '');
  };

  const filterFeedItems = (items: FeedItem[], term: string) => {
    if (!term.trim()) {
      setFilteredFeedItems(items);
      return;
    }

    const filtered = items.filter(item =>
      item.iAnfluencer.username.toLowerCase().includes(term.toLowerCase()) ||
      item.iAnfluencer.displayName.toLowerCase().includes(term.toLowerCase())
    );

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

  useEffect(() => {
    fetchFeedData();
  }, []);

  // Re-filter when feedItems change
  useEffect(() => {
    filterFeedItems(feedItems, searchTerm);
  }, [feedItems, searchTerm]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-gray-600">Cargando contenido...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSearch={handleSearch} searchTerm={searchTerm} onClearSearch={handleClearSearch}>
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-4">
          <div className="flex">
            <div className="text-yellow-800">
              <strong>Modo Demo:</strong> {error}
            </div>
          </div>
        </div>
      )}
      <Feed feedItems={filteredFeedItems} onRefresh={fetchFeedData} onClearSearch={handleClearSearch} />
    </Layout>
  );
}

export default App;
