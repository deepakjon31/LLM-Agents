#!/usr/bin/env python3
"""
Database migration script for the backend
"""

import os
import sys
import importlib
import logging
from sqlalchemy import text

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run all migrations"""
    # Get the path to the migrations directory
    migrations_dir = os.path.join('src', 'common', 'db', 'migrations')
    
    # Check if the directory exists
    if not os.path.exists(migrations_dir):
        logger.error(f"Migrations directory {migrations_dir} does not exist")
        return
    
    # Get all Python files in the migrations directory
    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py'])
    
    if not migration_files:
        logger.info("No migration files found")
        return
    
    logger.info(f"Found {len(migration_files)} migration files")
    
    # Run each migration
    for migration_file in migration_files:
        try:
            # Get the module name
            module_name = f"src.common.db.migrations.{migration_file[:-3]}"
            
            # Import the module
            logger.info(f"Running migration {migration_file}")
            module = importlib.import_module(module_name)
            
            # Run the migration
            if hasattr(module, 'run_migration'):
                module.run_migration()
            else:
                logger.warning(f"Migration {migration_file} does not have a run_migration function")
        except Exception as e:
            logger.error(f"Error running migration {migration_file}: {e}")

if __name__ == "__main__":
    logger.info("Starting database migrations")
    run_migrations()
    logger.info("Database migrations completed") 