#!/usr/bin/env python3
import sys
import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.insert(0, '/app')

# Import the necessary modules
try:
    from src.common.db.schema import Base, Role, Permission, role_permission
except ImportError:
    print("Could not import schema classes. Make sure you're running this inside the container.")
    sys.exit(1)

# Database connection parameters - use environment variables
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Password1") 
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "agentic_rag")

db_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
print(f"Connecting to database: {db_url}")

# Create engine and session
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Verify database tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Available tables: {tables}")
    
    # First, check if the admin role exists
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    
    if not admin_role:
        print("Admin role does not exist. Creating it...")
        admin_role = Role(
            name="admin", 
            description="Administrator role with full access to system"
        )
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)
        print(f"Created admin role with ID: {admin_role.id}")
    else:
        print(f"Found existing admin role with ID: {admin_role.id}")
    
    # Check if admin_access permission exists
    admin_permission = db.query(Permission).filter(Permission.name == "admin_access").first()
    
    if not admin_permission:
        print("Creating admin_access permission...")
        admin_permission = Permission(
            name="admin_access",
            description="Provides access to the admin panel",
            resource="admin",
            action="access"
        )
        db.add(admin_permission)
        db.commit()
        db.refresh(admin_permission)
        print(f"Created admin_access permission with ID: {admin_permission.id}")
    else:
        print(f"Found existing admin_access permission with ID: {admin_permission.id}")
    
    # Check if the role and permission are linked
    # Check if the role and permission association exists
    role_perm = db.execute(
        role_permission.select().where(
            role_permission.c.role_id == admin_role.id,
            role_permission.c.permission_id == admin_permission.id
        )
    ).fetchone()
    
    if not role_perm:
        print("Linking admin role to admin_access permission...")
        db.execute(
            role_permission.insert().values(
                role_id=admin_role.id,
                permission_id=admin_permission.id
            )
        )
        db.commit()
        print(f"Associated admin permission with admin role")
    else:
        print("Admin role already has admin_access permission")
    
    # List all permissions assigned to the admin role
    admin_permissions = db.query(Permission).join(
        role_permission, 
        Permission.id == role_permission.c.permission_id
    ).filter(
        role_permission.c.role_id == admin_role.id
    ).all()
    
    print(f"\nPermissions assigned to admin role:")
    for perm in admin_permissions:
        print(f"- {perm.name}: {perm.description} ({perm.resource}:{perm.action})")
    
    print("\nSetup completed successfully!")
    
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
    raise
finally:
    db.close() 