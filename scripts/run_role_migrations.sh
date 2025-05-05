#!/bin/bash

# Script to run the database migrations for role-based access control

echo "Starting role-based access control migrations..."

# First, check if we're running inside Docker or directly
if [ -f /.dockerenv ]; then
    echo "Running in Docker environment"
    cd /app
else
    echo "Running in local environment"
    cd "$(dirname "$0")/.."
fi

# Activate Python environment if running locally
if [ ! -f /.dockerenv ] && [ -d "venv" ]; then
    echo "Activating virtual environment"
    source venv/bin/activate
fi

# Run the migration script
echo "Executing role-based migration script..."
python -m backend.src.common.db.migrations.add_roles_and_permissions

# Check if the migration ran successfully
if [ $? -eq 0 ]; then
    echo "Role-based migrations completed successfully!"
else
    echo "Migration failed. Please check the logs for details."
    exit 1
fi

echo "Migration process completed." 