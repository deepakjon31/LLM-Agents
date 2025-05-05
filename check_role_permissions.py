#!/usr/bin/env python3
import sys
import os
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.insert(0, '/app')

# Import the necessary modules
try:
    from src.common.db.schema import Base, Role, Permission, role_permission, User
except ImportError:
    print("Could not import schema classes. Make sure you're running this inside the container.")
    sys.exit(1)

# Database connection parameters
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "Password1" 
POSTGRES_SERVER = "postgres"
POSTGRES_PORT = "5432"
POSTGRES_DB = "agentic_rag"

# Connect to database
conn_str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
print(f"Connecting to database: {conn_str}")

engine = create_engine(conn_str)
Session = sessionmaker(bind=engine)
session = Session()

# Find user with mobile number 1234567890
user = session.query(User).filter(User.mobile_number == "1234567890").first()
if not user:
    print("User with mobile number 1234567890 not found")
    sys.exit(1)

print(f"Found user: ID={user.id}, Mobile={user.mobile_number}, Role ID={user.role_id}")

# Find role information
if not user.role_id:
    print("User has no role assigned")
    sys.exit(1)

role = session.query(Role).filter(Role.id == user.role_id).first()
if not role:
    print(f"Role with ID {user.role_id} not found")
    sys.exit(1)

print(f"User has role: ID={role.id}, Name={role.name}, Description={role.description}")

# Find permissions for this role
permissions = session.query(Permission).join(
    role_permission,
    Permission.id == role_permission.c.permission_id
).filter(role_permission.c.role_id == role.id).all()

print(f"\nPermissions for {role.name} role:")
if not permissions:
    print("No permissions assigned")
else:
    for p in permissions:
        print(f"- {p.id}: {p.name} - {p.description} ({p.resource}:{p.action})")

# Check if "admin_access" permission exists and is assigned to the role
admin_access = session.query(Permission).filter(Permission.name == "admin_access").first()
if not admin_access:
    print("\nWARNING: admin_access permission does not exist in the database!")
else:
    print(f"\nFound admin_access permission: ID={admin_access.id}, Resource={admin_access.resource}, Action={admin_access.action}")
    
    # Check if the permission is assigned to the role
    role_has_perm = session.query(role_permission).filter(
        role_permission.c.role_id == role.id,
        role_permission.c.permission_id == admin_access.id
    ).first()
    
    if role_has_perm:
        print(f"admin_access permission IS assigned to {role.name} role")
    else:
        print(f"WARNING: admin_access permission is NOT assigned to {role.name} role")

print("\nCheck complete") 