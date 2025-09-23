import React from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import { getMockFeedItems } from './services/mockData';

function App() {
  const feedItems = getMockFeedItems();

  return (
    <Layout>
      <Feed feedItems={feedItems} />
    </Layout>
  );
}

export default App;
