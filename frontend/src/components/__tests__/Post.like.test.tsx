import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Post from '../Post';
import { apiService } from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService', () => ({
  apiService: {
    getLikeStatus: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

const mockFeedItem = {
  post: {
    id: 1,
    content: 'Test post content',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: '2025-10-03T10:00:00Z',
    likesCount: 5,
    isLiked: false,
    commentsCount: 2,
  },
  iAnfluencer: {
    id: 1,
    username: 'test_user',
    displayName: 'Test User',
    profileImage: 'https://example.com/profile.jpg',
    isVerified: true,
  },
  comments: [
    {
      id: 1,
      content: 'Great post!',
      createdAt: '2025-10-03T10:30:00Z',
      iAnfluencerId: 2,
    },
  ],
};

describe('Post Like Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads like status from API on mount', async () => {
    mockApiService.getLikeStatus.mockResolvedValue({
      likes_count: 10,
      is_liked: true,
    });

    render(<Post feedItem={mockFeedItem} />);

    await waitFor(() => {
      expect(mockApiService.getLikeStatus).toHaveBeenCalledWith('1');
    });

    // Should show updated counts from API
    await waitFor(() => {
      expect(screen.getByText(/10 likes/i)).toBeInTheDocument();
    });
  });

  it('handles like action correctly', async () => {
    mockApiService.getLikeStatus.mockResolvedValue({
      likes_count: 5,
      is_liked: false,
    });

    mockApiService.likePost.mockResolvedValue({
      likes_count: 6,
      is_liked: true,
    });

    render(<Post feedItem={mockFeedItem} />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockApiService.getLikeStatus).toHaveBeenCalled();
    });

    const likeButton = screen.getByRole('button', { name: /me gusta/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockApiService.likePost).toHaveBeenCalledWith('1');
    });

    // Should show updated count
    expect(screen.getByText('6 likes')).toBeInTheDocument();
  });

  it('handles unlike action correctly', async () => {
    mockApiService.getLikeStatus.mockResolvedValue({
      likes_count: 5,
      is_liked: true,
    });

    mockApiService.unlikePost.mockResolvedValue({
      likes_count: 4,
      is_liked: false,
    });

    render(<Post feedItem={mockFeedItem} />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockApiService.getLikeStatus).toHaveBeenCalled();
    });

    const likeButton = screen.getByRole('button', { name: /me gusta/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockApiService.unlikePost).toHaveBeenCalledWith('1');
    });

    // Should show updated count
    expect(screen.getByText('4 likes')).toBeInTheDocument();
  });

  it('shows loading state during API call', async () => {
    mockApiService.getLikeStatus.mockResolvedValue({
      likes_count: 5,
      is_liked: false,
    });

    // Make the like API call take some time
    mockApiService.likePost.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        likes_count: 6,
        is_liked: true,
      }), 100))
    );

    render(<Post feedItem={mockFeedItem} />);

    await waitFor(() => {
      expect(mockApiService.getLikeStatus).toHaveBeenCalled();
    });

    const likeButton = screen.getByRole('button', { name: /me gusta/i });
    fireEvent.click(likeButton);

    // Button should be disabled during loading
    expect(likeButton).toBeDisabled();

    await waitFor(() => {
      expect(likeButton).not.toBeDisabled();
    });
  });

  it('reverts optimistic update on API error', async () => {
    mockApiService.getLikeStatus.mockResolvedValue({
      likes_count: 5,
      is_liked: false,
    });

    mockApiService.likePost.mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<Post feedItem={mockFeedItem} />);

    await waitFor(() => {
      expect(mockApiService.getLikeStatus).toHaveBeenCalled();
    });

    const likeButton = screen.getByRole('button', { name: /me gusta/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update like status:', expect.any(Error));
    });

    // Should revert to original count
    expect(screen.getByText('5 likes')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});