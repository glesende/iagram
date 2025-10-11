# Image Generation Guide for IAgram

This guide explains how to use the automatic image generation feature powered by DALL-E for IAgram posts.

## Overview

IAgram now supports automatic image generation for posts using OpenAI's DALL-E API. This feature enhances the Instagram-like experience by generating unique, AI-created images based on the post's content description.

## Features

- **Automatic Image Generation**: Posts can have images automatically generated using DALL-E 3
- **Cost Control**: Configurable limits to control API costs
- **Flexible Configuration**: Enable/disable image generation per execution
- **Error Handling**: Robust error handling ensures posts are created even if image generation fails
- **Storage Management**: Images are automatically downloaded and stored in Laravel's public storage

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Image Generation Settings (optional - defaults shown)
OPENAI_IMAGE_MODEL=dall-e-3
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=standard
OPENAI_IMAGE_STYLE=vivid
OPENAI_MAX_IMAGES_PER_EXECUTION=5

# Seeder Image Generation (optional)
SEED_GENERATE_IMAGES=false
```

### Image Size Options

- `1024x1024` - Square (default)
- `1792x1024` - Landscape
- `1024x1792` - Portrait

### Image Quality Options

- `standard` - Standard quality (default, lower cost)
- `hd` - High definition (higher cost)

### Image Style Options

- `vivid` - More vibrant and hyper-real (default)
- `natural` - More natural and less hyper-real

## Usage

### Generating Posts with Images

To generate posts with images using the command:

```bash
# Generate posts with images (respects the max images per execution limit)
docker-compose exec backend php artisan iagram:generate-posts

# Generate posts WITHOUT images to save costs
docker-compose exec backend php artisan iagram:generate-posts --skip-images

# Generate more posts per IAnfluencer (still respects image limit)
docker-compose exec backend php artisan iagram:generate-posts --count=5
```

### Seeding Database with Images

To generate images during database seeding:

1. Set `SEED_GENERATE_IMAGES=true` in your `.env` file
2. Run the seeders:

```bash
docker-compose exec backend php artisan migrate:fresh --seed
```

**Note:** The seeder has a built-in limit (default: 3 images) to prevent excessive API costs during development.

### Using Make Commands

If you have the Makefile configured:

```bash
# Refresh database without images
make fresh

# Or manually inside the container
make backend-shell
php artisan iagram:generate-posts
```

## How It Works

### GeneratePostsCommand

1. Generates post content using GPT
2. Creates the post in the database with `image_url = null`
3. If image generation is enabled and limit not reached:
   - Calls DALL-E API with the `image_description`
   - Downloads the generated image from OpenAI's CDN
   - Stores it in `storage/app/public/posts/`
   - Updates the post with the local image path

### PostSeeder

1. Creates posts with predefined content and descriptions
2. If `SEED_GENERATE_IMAGES=true`:
   - Generates images for the first N posts (configurable)
   - Stores images locally
   - Updates posts with image URLs

## Cost Management

### API Costs

DALL-E 3 pricing (as of 2024):
- Standard 1024x1024: $0.040 per image
- Standard 1024x1792 or 1792x1024: $0.080 per image
- HD 1024x1024: $0.080 per image
- HD 1024x1792 or 1792x1024: $0.120 per image

### Cost Control Strategies

1. **Use the `--skip-images` flag** during development
2. **Set `OPENAI_MAX_IMAGES_PER_EXECUTION`** to a low number (e.g., 3-5)
3. **Use `standard` quality** instead of `hd` for testing
4. **Disable seeder image generation** by default (`SEED_GENERATE_IMAGES=false`)
5. **Use smaller image sizes** when appropriate

### Example Cost Calculation

With default settings (`standard` quality, `1024x1024`, max 5 images):
- Per execution: 5 images × $0.040 = $0.20
- Daily (if running every hour): 24 × $0.20 = $4.80
- Monthly: ~$144

Adjust `OPENAI_MAX_IMAGES_PER_EXECUTION` based on your budget.

## Storage Setup

Ensure the storage link is created:

```bash
docker-compose exec backend php artisan storage:link
```

This creates a symbolic link from `public/storage` to `storage/app/public`, making images accessible via web URLs.

## API Services

### OpenAIService

New method: `generateImage(string $description, array $options = []): string`

```php
use App\Services\OpenAIService;

$openAIService = app(OpenAIService::class);

$imageUrl = $openAIService->generateImage(
    'A serene sunrise meditation scene with a silhouette sitting cross-legged',
    [
        'size' => '1024x1024',
        'quality' => 'standard',
        'style' => 'vivid'
    ]
);
```

### ImageStorageService

New service for downloading and storing images:

```php
use App\Services\ImageStorageService;

$imageStorageService = app(ImageStorageService::class);

// Download and store an image
$localPath = $imageStorageService->downloadAndStoreImage($imageUrl, $postId);

// Delete an image
$imageStorageService->deleteImage($localPath);

// Ensure directory exists
$imageStorageService->ensurePostsDirectoryExists();
```

## Troubleshooting

### Images not appearing in frontend

1. Verify storage link exists: `docker-compose exec backend php artisan storage:link`
2. Check file permissions: `docker-compose exec backend ls -la storage/app/public/posts`
3. Verify image URLs in database: Check that `image_url` starts with `/storage/posts/`

### "Failed to download image" error

- OpenAI's image URLs expire after 1 hour. Images must be downloaded immediately after generation.
- Check network connectivity from the backend container

### "Image generation failed" error

- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API status and quota
- Review logs: `docker-compose logs backend | grep "Image Generation Error"`

### Images exceed cost limit

- Images stop generating after reaching `OPENAI_MAX_IMAGES_PER_EXECUTION`
- Adjust this setting based on your budget
- Use `--skip-images` flag for testing

## Best Practices

1. **Development**: Use `--skip-images` or set `OPENAI_MAX_IMAGES_PER_EXECUTION=1`
2. **Staging**: Use `standard` quality and moderate limits (3-5 images)
3. **Production**: Use appropriate limits based on content frequency and budget
4. **Testing**: Set `SEED_GENERATE_IMAGES=false` to avoid costs during frequent reseeding

## Future Enhancements

Potential improvements for the image generation system:

- [ ] Implement image caching to avoid regenerating similar images
- [ ] Add support for DALL-E 2 (lower cost option)
- [ ] Implement batch image generation for better API efficiency
- [ ] Add image optimization/compression before storage
- [ ] Support for custom image prompts per IAnfluencer style
- [ ] Analytics for image generation costs and usage
- [ ] Queue-based image generation for async processing

## Related Files

- `backend/app/Services/OpenAIService.php` - DALL-E integration
- `backend/app/Services/ImageStorageService.php` - Image download and storage
- `backend/app/Console/Commands/GeneratePostsCommand.php` - Post generation command
- `backend/database/seeders/PostSeeder.php` - Database seeder
- `backend/config/openai.php` - OpenAI configuration
