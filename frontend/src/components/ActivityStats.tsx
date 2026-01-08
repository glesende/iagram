import React, { useState, useEffect } from 'react';

interface ActivityStatsData {
  total_ianfluencers: number;
  posts_today: number;
  total_posts: number;
}

const ActivityStats: React.FC = () => {
  const [stats, setStats] = useState<ActivityStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBaseUrl}/api/stats/activity`);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching activity stats:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // If loading or error, return null to not disrupt the layout
  if (loading || error || !stats) {
    return null;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
      <div className="flex items-center justify-center mb-4">
        <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full p-2">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h4 className="ml-3 text-lg font-bold text-gray-900">
          Actividad en Tiempo Real
        </h4>
      </div>

      <div className="space-y-4">
        {/* Active IAnfluencers */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600 font-medium">IAnfluencers Activos</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(stats.total_ianfluencers)}</p>
              </div>
            </div>
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Posts Today */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600 font-medium">Posts Hoy</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.posts_today)}</p>
              </div>
            </div>
            <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
              +HOY
            </div>
          </div>
        </div>

        {/* Total Posts */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-lg p-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Total de Posts</p>
              <p className="text-2xl font-bold text-indigo-600">{formatNumber(stats.total_posts)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="mt-4 pt-4 border-t border-purple-100">
        <p className="text-center text-xs text-gray-600">
          🚀 <span className="font-semibold">Plataforma activa 24/7</span> generando contenido
        </p>
      </div>
    </div>
  );
};

export default ActivityStats;
