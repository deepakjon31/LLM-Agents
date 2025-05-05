#!/usr/bin/env python3
"""
Script to create an admin user in the database.
This ensures there's always at least one admin user with the admin role.
"""

import sys
import os
import argparse
import logging
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the app directory to the Python path if necessary
if os.path.exists('/app') and '/app' not in sys.path:
    sys.path.insert(0, '/app')

# Import the necessary modules
from src.common.db.schema import Base, User, Role
from src.apis.auth import get_password_hash
from src.common.config import AuthConfig, DatabaseConfig

# Constants
DEFAULT_MOBILE = '1234567890'
DEFAULT_PASSWORD = 'test'

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--mobile", default=DEFAULT_MOBILE, 
                       help=f"Mobile number for the admin user (default: {DEFAULT_MOBILE})")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, 
                       help=f"Password for the admin user (default: {DEFAULT_PASSWORD})")
    return parser.parse_args()

def create_admin_user(mobile, password):
    """Create or update an admin user with the admin role"""
    db_url = DatabaseConfig.get_connection_url()
    logger.info(f"Connecting to database at: {db_url}")
    
    # Create engine and session
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Verify the tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.debug(f"Available tables: {tables}")
        
        # First, make sure admin role exists
        admin_role = db.query(Role).filter(Role.name == AuthConfig.ADMIN_ROLE_NAME).first()
        
        if not admin_role:
            logger.info(f"Admin role '{AuthConfig.ADMIN_ROLE_NAME}' not found. Creating it...")
            admin_role = Role(
                name=AuthConfig.ADMIN_ROLE_NAME, 
                description="Administrator role with full access to system"
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            logger.info(f"Created admin role with ID: {admin_role.id}")
        else:
            logger.info(f"Found existing admin role with ID: {admin_role.id}")
        
        # Now check if user exists
        existing_user = db.query(User).filter(User.mobile_number == mobile).first()
        
        if existing_user:
            logger.info(f"User with mobile {mobile} already exists, updating...")
            existing_user.password_hash = get_password_hash(password)
            existing_user.role_id = admin_role.id  # Set role directly
            db.commit()
            logger.info(f"Updated user: {existing_user.id} - {existing_user.mobile_number} (role_id={existing_user.role_id})")
            return existing_user
        else:
            # Create new user with admin role
            password_hash = get_password_hash(password)
            new_user = User(
                mobile_number=mobile,
                password_hash=password_hash,
                role_id=admin_role.id  # Set role directly
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            logger.info(f"Created new admin user: {new_user.id} - {new_user.mobile_number} (role_id={new_user.role_id})")
            return new_user
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating/updating admin user: {str(e)}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    args = parse_arguments()
    user = create_admin_user(args.mobile, args.password)
    
    if user:
        logger.info("Admin user setup completed successfully!")
    else:
        logger.error("Admin user setup failed.")
        sys.exit(1) 