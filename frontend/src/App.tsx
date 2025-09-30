import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import { getMockFeedItems } from './services/mockData';
import { apiService } from './services/apiService';
import { FeedItem } from './types';
import analyticsService from './services/analyticsService';

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize analytics session tracking
    analyticsService.trackSessionStart();

    const fetchFeedData = async () => {
      const startTime = performance.now();

      try {
        setLoading(true);
        setError(null);

        // Try to fetch real data from API
        const realFeedItems = await apiService.getFeedItems();
        const apiResponseTime = performance.now() - startTime;

        if (realFeedItems.length > 0) {
          setFeedItems(realFeedItems);
          console.log('✅ Using real API data');

          // Track successful API response
          analyticsService.trackPerformance('api_response_time', apiResponseTime, 'feed_load');
        } else {
          // Fallback to mock data if no real data available
          console.log('⚠️ No real data available, using mock data');
          setFeedItems(getMockFeedItems());

          // Track empty API response
          analyticsService.trackPerformance('api_response_time', apiResponseTime, 'feed_load_empty');
        }
      } catch (err) {
        // Fallback to mock data if API fails
        console.log('⚠️ API failed, falling back to mock data:', err);
        setError('API unavailable - showing sample content');
        setFeedItems(getMockFeedItems());

        const apiResponseTime = performance.now() - startTime;

        // Track API error
        analyticsService.trackError('api_error', err instanceof Error ? err.message : 'Unknown API error', 'feed_load');
        analyticsService.trackPerformance('api_response_time', apiResponseTime, 'feed_load_error');
      } finally {
        setLoading(false);

        // Track total load time
        const totalLoadTime = performance.now() - startTime;
        analyticsService.trackPerformance('load_time', totalLoadTime, 'app_initialization');
      }
    };

    fetchFeedData();
  }, []);

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
    <Layout>
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-4">
          <div className="flex">
            <div className="text-yellow-800">
              <strong>Modo Demo:</strong> {error}
            </div>
          </div>
        </div>
      )}
      <Feed feedItems={feedItems} />
    </Layout>
  );
}

export default App;
