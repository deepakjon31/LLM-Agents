#!/usr/bin/env python3
import sys
import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.insert(0, '/app')

# Import the necessary modules
try:
    from src.common.db.schema import Base, Role, Permission, role_permission, User
except ImportError:
    print("Could not import schema classes. Make sure you're running this inside the container.")
    sys.exit(1)

# Database connection parameters - use environment variables
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Password1") 
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "agentic_rag")

# Connect to database
conn_str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
print(f"Connecting to database: {conn_str}")

engine = create_engine(conn_str)
Session = sessionmaker(bind=engine)
session = Session()

# Print available tables
inspector = inspect(engine)
table_names = inspector.get_table_names()
print(f"Available tables: {table_names}")

# Get the admin role
admin_role = session.query(Role).filter(Role.name == "admin").first()

if not admin_role:
    print("Admin role not found. Creating...")
    admin_role = Role(name="admin", description="Administrator role with full access")
    session.add(admin_role)
    session.commit()
    print(f"Created admin role with ID: {admin_role.id}")
else:
    print(f"Found existing admin role with ID: {admin_role.id}")

# Define permissions that admin should have
admin_permissions = [
    {"name": "admin_access", "description": "Full administrative access", "resource": "admin", "action": "manage"},
    {"name": "manage_users", "description": "Manage users", "resource": "users", "action": "manage"},
    {"name": "manage_roles", "description": "Manage roles", "resource": "roles", "action": "manage"},
    {"name": "manage_permissions", "description": "Manage permissions", "resource": "permissions", "action": "manage"},
    {"name": "manage_databases", "description": "Allows managing database connections", "resource": "database", "action": "manage"},
    {"name": "manage_documents", "description": "Manage documents", "resource": "documents", "action": "manage"},
    {"name": "view_analytics", "description": "View system analytics", "resource": "analytics", "action": "view"},
]

# Ensure all permissions exist and are assigned to admin role
for perm_data in admin_permissions:
    # Check if permission exists
    permission = session.query(Permission).filter(Permission.name == perm_data["name"]).first()
    
    if not permission:
        print(f"Creating permission: {perm_data['name']}")
        permission = Permission(
            name=perm_data["name"],
            description=perm_data["description"],
            resource=perm_data["resource"],
            action=perm_data["action"]
        )
        session.add(permission)
        session.commit()
    
    # Check if admin role has this permission
    role_has_perm = session.query(role_permission).filter(
        role_permission.c.role_id == admin_role.id,
        role_permission.c.permission_id == permission.id
    ).first()
    
    if not role_has_perm:
        print(f"Assigning {perm_data['name']} permission to admin role")
        # Insert into role_permission association table
        session.execute(
            role_permission.insert().values(
                role_id=admin_role.id,
                permission_id=permission.id
            )
        )
        session.commit()

# Print all permissions assigned to admin role
admin_perms = session.query(Permission).join(
    role_permission, Permission.id == role_permission.c.permission_id
).filter(role_permission.c.role_id == admin_role.id).all()

print("\nPermissions assigned to admin role:")
for perm in admin_perms:
    print(f"- {perm.name}: {perm.description} ({perm.resource}:{perm.action})")

# Ensure the user with mobile number 1234567890 has admin role
admin_user = session.query(User).filter(User.mobile_number == "1234567890").first()

if admin_user:
    if admin_user.role_id != admin_role.id:
        print(f"Updating user {admin_user.id} ({admin_user.mobile_number}) to have admin role")
        admin_user.role_id = admin_role.id
        session.commit()
    else:
        print(f"User {admin_user.id} ({admin_user.mobile_number}) already has admin role")
else:
    print("Admin user with mobile 1234567890 not found")

print("\nSetup completed successfully!") 