#!/usr/bin/env python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys
import argparse
from pathlib import Path

# Add the parent directory to the path so we can import from the src package
sys.path.append(str(Path(__file__).parent.parent))

from src.common.db.schema import Base, User
from src.apis.auth import get_password_hash

def create_test_user(mobile_number, password, db_url=None):
    """Create a test user in the database"""
    if db_url is None:
        # Use environment variables or defaults
        POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
        POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
        POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
        POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
        POSTGRES_DB = os.getenv("POSTGRES_DB", "agentic_rag")
        
        db_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    
    print(f"Connecting to database: {db_url}")
    
    # Create engine and session
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if tables exist
        if not engine.dialect.has_table(engine, "users"):
            print("Creating database tables...")
            Base.metadata.create_all(bind=engine)
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.mobile_number == mobile_number).first()
        if existing_user:
            print(f"User with mobile {mobile_number} already exists, updating password...")
            existing_user.password_hash = get_password_hash(password)
            db.commit()
            print(f"Updated user: {existing_user.id} - {existing_user.mobile_number}")
            return existing_user
        
        # Create new user
        password_hash = get_password_hash(password)
        user = User(
            mobile_number=mobile_number,
            password_hash=password_hash
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"Created new user: {user.id} - {user.mobile_number}")
        return user
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a test user in the database")
    parser.add_argument("--mobile", default="1234567890", help="Mobile number for the test user")
    parser.add_argument("--password", default="Password1", help="Password for the test user")
    parser.add_argument("--db-url", help="Database URL (optional, will use env vars if not provided)")
    
    args = parser.parse_args()
    
    create_test_user(args.mobile, args.password, args.db_url) 