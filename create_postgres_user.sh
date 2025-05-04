#!/bin/bash

# Make sure Docker Compose is running
if ! docker-compose ps | grep -q "backend.*Up"; then
  echo "Backend container is not running. Please start Docker Compose first."
  echo "Run: docker-compose up -d"
  exit 1
fi

echo "Creating user with mobile number 8050518293 and password 'test123' in the database..."

# First, let's generate a proper bcrypt hash for the password using the backend's password hashing function
HASH=$(docker-compose exec -T backend python -c "from src.apis.auth import get_password_hash; print(get_password_hash('test123'))")

# Execute SQL command inside the docker container to create the user
docker-compose exec postgres psql -U postgres -d agentic_rag -c "INSERT INTO users (mobile_number, password_hash, created_at, updated_at) VALUES ('8050518293', '$HASH', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (mobile_number) DO UPDATE SET password_hash = '$HASH';"

echo "Done! You can now log in with:"
echo "Mobile number: 8050518293"
echo "Password: test123" 