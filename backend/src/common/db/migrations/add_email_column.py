"""
Migration script to add email column to users table if it doesn't exist
"""

import os
import sys
from sqlalchemy import create_engine, Column, String, text
from alembic import op
import sqlalchemy as sa

# Add the parent directory to the path so we can import the connection
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from src.common.db.connection import get_db_url

def run_migration():
    """Run the migration to add email column to users table"""
    # Get the database URL
    db_url = get_db_url()
    
    # Create engine
    engine = create_engine(db_url)
    
    # Check if email column exists
    with engine.connect() as conn:
        # Check if users table exists
        result = conn.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
        ))
        
        if not result.scalar():
            print("Users table does not exist yet, skipping migration")
            return
        
        # Check if email column exists
        result = conn.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email')"
        ))
        
        if result.scalar():
            print("Email column already exists, skipping migration")
            return
        
        # Add email column
        conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
        conn.commit()
        
        print("Added email column to users table")

if __name__ == "__main__":
    run_migration() 