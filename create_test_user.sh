#!/bin/bash

# Make sure Docker Compose is running
if ! docker-compose ps | grep -q "backend.*Up"; then
  echo "Backend container is not running. Please start Docker Compose first."
  echo "Run: docker-compose up -d"
  exit 1
fi

# Default values
MOBILE="1234567890"
PASSWORD="Password1"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mobile=*)
      MOBILE="${1#*=}"
      shift
      ;;
    --password=*)
      PASSWORD="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--mobile=1234567890] [--password=Password1]"
      exit 1
      ;;
  esac
done

echo "Creating test user with mobile: $MOBILE and password: $PASSWORD"

# Execute the Python script inside the Docker container
docker-compose exec backend python -m scripts.create_test_user --mobile="$MOBILE" --password="$PASSWORD"

echo "Done!" 