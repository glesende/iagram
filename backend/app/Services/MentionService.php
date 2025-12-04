<?php

namespace App\Services;

use App\Models\IAnfluencer;

class MentionService
{
    /**
     * Extract mentions from text content
     * Matches @username pattern
     *
     * @param string $content
     * @return array Array of usernames mentioned (without @)
     */
    public function extractMentions(string $content): array
    {
        // Match @username pattern (alphanumeric, underscores, dots, and hyphens)
        preg_match_all('/@([a-zA-Z0-9._-]+)/', $content, $matches);

        if (empty($matches[1])) {
            return [];
        }

        // Return unique usernames
        return array_unique($matches[1]);
    }

    /**
     * Validate that mentioned usernames exist
     * Returns only valid IAnfluencer usernames
     *
     * @param array $usernames
     * @return array Array of valid usernames
     */
    public function validateMentions(array $usernames): array
    {
        if (empty($usernames)) {
            return [];
        }

        // Query database for existing IAnfluencers
        $validUsernames = IAnfluencer::whereIn('username', $usernames)
            ->pluck('username')
            ->toArray();

        return $validUsernames;
    }

    /**
     * Extract and validate mentions from content
     * Returns array of valid IAnfluencer usernames
     *
     * @param string $content
     * @return array
     */
    public function processMentions(string $content): array
    {
        $extractedMentions = $this->extractMentions($content);

        if (empty($extractedMentions)) {
            return [];
        }

        return $this->validateMentions($extractedMentions);
    }

    /**
     * Get IAnfluencers mentioned in a specific post
     *
     * @param int $postId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getMentionedIAnfluencersInPost(int $postId)
    {
        $post = \App\Models\Post::find($postId);

        if (!$post || empty($post->mentions)) {
            return collect();
        }

        return IAnfluencer::whereIn('username', $post->mentions)->get();
    }

    /**
     * Get IAnfluencers mentioned in a specific comment
     *
     * @param int $commentId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getMentionedIAnfluencersInComment(int $commentId)
    {
        $comment = \App\Models\Comment::find($commentId);

        if (!$comment || empty($comment->mentions)) {
            return collect();
        }

        return IAnfluencer::whereIn('username', $comment->mentions)->get();
    }

    /**
     * Get posts that mention a specific IAnfluencer
     *
     * @param string $username
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPostsMentioning(string $username, int $limit = 20)
    {
        return \App\Models\Post::whereJsonContains('mentions', $username)
            ->with(['iAnfluencer'])
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get comments that mention a specific IAnfluencer
     *
     * @param string $username
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getCommentsMentioning(string $username, int $limit = 20)
    {
        return \App\Models\Comment::whereJsonContains('mentions', $username)
            ->with(['iAnfluencer', 'post'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
