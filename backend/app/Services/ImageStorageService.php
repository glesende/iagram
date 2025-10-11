<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImageStorageService
{
    /**
     * Download an image from a URL and store it in the posts directory
     *
     * @param string $imageUrl The URL of the image to download
     * @param string $postId The ID of the post (for organizing files)
     * @return string The relative path to the stored image
     * @throws Exception If download or storage fails
     */
    public function downloadAndStoreImage(string $imageUrl, string $postId): string
    {
        try {
            // Generate a unique filename
            $filename = 'post_' . $postId . '_' . time() . '.png';
            $path = 'posts/' . $filename;

            // Download the image content
            $imageContent = @file_get_contents($imageUrl);

            if ($imageContent === false) {
                throw new Exception("Failed to download image from URL: {$imageUrl}");
            }

            // Store the image in the public disk
            Storage::disk('public')->put($path, $imageContent);

            // Return the public URL path
            return '/storage/' . $path;

        } catch (Exception $e) {
            Log::error('Image Storage Error: ' . $e->getMessage(), [
                'url' => $imageUrl,
                'post_id' => $postId
            ]);
            throw new Exception('Error storing image: ' . $e->getMessage());
        }
    }

    /**
     * Delete an image from storage
     *
     * @param string $imagePath The relative path to the image
     * @return bool True if successful
     */
    public function deleteImage(string $imagePath): bool
    {
        try {
            // Remove /storage/ prefix if present
            $path = str_replace('/storage/', '', $imagePath);

            if (Storage::disk('public')->exists($path)) {
                return Storage::disk('public')->delete($path);
            }

            return true;
        } catch (Exception $e) {
            Log::error('Image Deletion Error: ' . $e->getMessage(), [
                'path' => $imagePath
            ]);
            return false;
        }
    }

    /**
     * Ensure the posts directory exists
     *
     * @return void
     */
    public function ensurePostsDirectoryExists(): void
    {
        if (!Storage::disk('public')->exists('posts')) {
            Storage::disk('public')->makeDirectory('posts');
        }
    }
}
