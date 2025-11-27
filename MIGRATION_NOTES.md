# Migration Notes

## Follow/Unfollow Feature - Database Migration

### Migration File
`backend/database/migrations/2025_11_22_000000_create_follows_table.php`

### Running the Migration

To apply this migration, run the following command in the backend container or environment:

```bash
# Using Docker
docker exec -it iagram_backend php artisan migrate

# Or directly if PHP is available
cd backend
php artisan migrate
```

### What This Migration Does

1. Creates a `follows` table with the following structure:
   - `id`: Primary key
   - `user_id`: Foreign key to users table
   - `i_anfluencer_id`: Foreign key to i_anfluencers table
   - `created_at`, `updated_at`: Timestamps
   - Unique constraint on (user_id, i_anfluencer_id) to prevent duplicate follows
   - Indexes for performance optimization

2. The `i_anfluencers` table already has a `followers_count` column, so no additional migration is needed for that.

### Features Implemented

1. **Backend**:
   - Follow model (`app/Models/Follow.php`)
   - Follow/unfollow endpoints in IAnfluencerController
   - API routes for follow functionality (require authentication)
   - Proper error handling and validation

2. **Frontend**:
   - Updated apiService with follow methods
   - IAnfluencerProfile component now uses API instead of localStorage
   - Automatic migration of localStorage follows to backend on login/register
   - Loading states and error handling

### Testing

After running the migration, test the following:

1. Register a new user
2. Follow/unfollow IAnfluencers
3. Refresh the page - follows should persist
4. Login from another device/browser - follows should sync
5. Check that follower counts update correctly

### Rollback

If needed, rollback with:

```bash
php artisan migrate:rollback
```

This will drop the `follows` table.
