#!/usr/bin/env python3
"""
Script to set up admin role-permission mapping in the database.
This ensures that the admin role has the admin_access permission.
"""

import logging
import sys
import os
from sqlalchemy.exc import SQLAlchemyError

# Add the app directory to the Python path if necessary
if os.path.exists('/app') and '/app' not in sys.path:
    sys.path.insert(0, '/app')

from src.common.db.connection import SessionLocal
from src.common.db.schema import Role, Permission, role_permission
from src.common.config import AuthConfig

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_admin_permission():
    """Associate admin role with admin_access permission if not already associated."""
    db = SessionLocal()
    
    try:
        # Find the admin role and permission
        admin_role = db.query(Role).filter(Role.name == AuthConfig.ADMIN_ROLE_NAME).first()
        admin_permission = db.query(Permission).filter(Permission.name == AuthConfig.ADMIN_PERMISSION_NAME).first()
        
        if not admin_role:
            logger.error(f"Admin role '{AuthConfig.ADMIN_ROLE_NAME}' not found in database")
            return False
            
        if not admin_permission:
            logger.error(f"Admin permission '{AuthConfig.ADMIN_PERMISSION_NAME}' not found in database")
            return False
        
        # Check if association already exists
        existing = db.execute(
            role_permission.select().where(
                role_permission.c.role_id == admin_role.id,
                role_permission.c.permission_id == admin_permission.id
            )
        ).fetchone()
        
        if not existing:
            # Create the association
            db.execute(role_permission.insert().values(
                role_id=admin_role.id, 
                permission_id=admin_permission.id
            ))
            db.commit()
            logger.info(f'Associated admin permission {admin_permission.id} with admin role {admin_role.id}')
            return True
        else:
            logger.info('Association already exists')
            return True
            
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    setup_admin_permission() 