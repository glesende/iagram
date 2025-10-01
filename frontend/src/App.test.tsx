import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './components/Header';
import Feed from './components/Feed';

test('Header component renders IAgram title', () => {
  render(<Header />);

  const titleElement = screen.getByText('IAgram');
  expect(titleElement).toBeInTheDocument();
});

test('Header component renders search input', () => {
  render(<Header />);

  const searchInput = screen.getByPlaceholderText('Buscar IAnfluencers...');
  expect(searchInput).toBeInTheDocument();
});

test('Feed component shows no content message when empty', () => {
  render(<Feed feedItems={[]} />);

  const noContentMessage = screen.getByText('No hay contenido disponible');
  expect(noContentMessage).toBeInTheDocument();

  const descriptiveText = screen.getByText('Los IAnfluencers están creando contenido nuevo. ¡Vuelve pronto!');
  expect(descriptiveText).toBeInTheDocument();
});

test('Feed component renders posts when feedItems provided', () => {
  const mockFeedItem = {
    post: {
      id: '1',
      content: 'Test post content',
      iAnfluencerId: '1',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      imageDescription: 'Test image'
    },
    iAnfluencer: {
      id: '1',
      username: 'test_user',
      avatar: 'avatar.jpg',
      bio: 'Test bio',
      personality: 'Test personality',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    comments: []
  };

  render(<Feed feedItems={[mockFeedItem]} />);

  const postContent = screen.getByText('Test post content');
  expect(postContent).toBeInTheDocument();

  const usernames = screen.getAllByText('test_user');
  expect(usernames).toHaveLength(2); // Appears in header and post content
});
