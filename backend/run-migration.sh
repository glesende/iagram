#!/bin/bash

# Run Laravel migrations inside Docker container
# This script runs the pending migrations in the backend container

echo "Running migrations in Docker container..."
docker exec iagram_backend php artisan migrate

echo "Migrations completed!"
