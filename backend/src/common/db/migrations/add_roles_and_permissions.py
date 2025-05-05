"""Migration script to add roles and permissions tables and update users table with role_id field."""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection settings from environment variables
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Password1")
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "agentic_rag")

# Create SQLAlchemy engine
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
engine = create_engine(DATABASE_URL)

def run_migration():
    """Run the migration to add role-based access control tables and fields."""
    try:
        with engine.connect() as connection:
            # Create roles table
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Create permissions table
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS permissions (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description VARCHAR(255),
                    resource VARCHAR(50) NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Create role_permission association table
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS role_permission (
                    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                    PRIMARY KEY (role_id, permission_id)
                )
            """))
            
            # Add role_id column to users table if it doesn't exist
            connection.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'role_id'
                    ) THEN
                        ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
                    END IF;
                END $$;
            """))
            
            # Insert default roles
            connection.execute(text("""
                INSERT INTO roles (name, description) 
                VALUES
                    ('admin', 'Administrator with full system access'),
                    ('developer', 'Developer with access to code and technical features'),
                    ('analyst', 'Analyst with access to data analysis features'),
                    ('user', 'Standard user with basic access')
                ON CONFLICT (name) DO NOTHING;
            """))
            
            # Insert default permissions
            connection.execute(text("""
                INSERT INTO permissions (name, resource, action, description) 
                VALUES
                    ('manage_users', 'user', 'manage', 'Manage users'),
                    ('manage_roles', 'role', 'manage', 'Manage roles and permissions'),
                    ('view_dashboard', 'dashboard', 'view', 'View admin dashboard'),
                    ('manage_databases', 'database', 'manage', 'Add and manage database connections'),
                    ('view_databases', 'database', 'view', 'View database connections'),
                    ('query_databases', 'database', 'query', 'Query databases'),
                    ('manage_documents', 'document', 'manage', 'Upload and manage documents'),
                    ('view_documents', 'document', 'view', 'View documents'),
                    ('manage_chat', 'chat', 'manage', 'Manage chat history'),
                    ('use_chat', 'chat', 'use', 'Use chat functionality')
                ON CONFLICT (name) DO NOTHING;
            """))
            
            # Assign permissions to roles
            # Admin role - all permissions
            admin_role_id = connection.execute(text("SELECT id FROM roles WHERE name = 'admin'")).fetchone()[0]
            all_permission_ids = connection.execute(text("SELECT id FROM permissions")).fetchall()
            for perm_id in all_permission_ids:
                connection.execute(text(f"""
                    INSERT INTO role_permission (role_id, permission_id)
                    VALUES ({admin_role_id}, {perm_id[0]})
                    ON CONFLICT DO NOTHING
                """))
            
            # Developer role
            developer_role_id = connection.execute(text("SELECT id FROM roles WHERE name = 'developer'")).fetchone()[0]
            developer_permissions = [
                'view_dashboard', 'view_databases', 'query_databases', 
                'manage_databases', 'manage_documents', 'view_documents',
                'manage_chat', 'use_chat'
            ]
            for perm_name in developer_permissions:
                perm_id = connection.execute(text(f"SELECT id FROM permissions WHERE name = '{perm_name}'")).fetchone()
                if perm_id:
                    connection.execute(text(f"""
                        INSERT INTO role_permission (role_id, permission_id)
                        VALUES ({developer_role_id}, {perm_id[0]})
                        ON CONFLICT DO NOTHING
                    """))
            
            # Analyst role
            analyst_role_id = connection.execute(text("SELECT id FROM roles WHERE name = 'analyst'")).fetchone()[0]
            analyst_permissions = [
                'view_dashboard', 'view_databases', 'query_databases',
                'view_documents', 'use_chat'
            ]
            for perm_name in analyst_permissions:
                perm_id = connection.execute(text(f"SELECT id FROM permissions WHERE name = '{perm_name}'")).fetchone()
                if perm_id:
                    connection.execute(text(f"""
                        INSERT INTO role_permission (role_id, permission_id)
                        VALUES ({analyst_role_id}, {perm_id[0]})
                        ON CONFLICT DO NOTHING
                    """))
            
            # User role
            user_role_id = connection.execute(text("SELECT id FROM roles WHERE name = 'user'")).fetchone()[0]
            user_permissions = ['view_documents', 'use_chat']
            for perm_name in user_permissions:
                perm_id = connection.execute(text(f"SELECT id FROM permissions WHERE name = '{perm_name}'")).fetchone()
                if perm_id:
                    connection.execute(text(f"""
                        INSERT INTO role_permission (role_id, permission_id)
                        VALUES ({user_role_id}, {perm_id[0]})
                        ON CONFLICT DO NOTHING
                    """))
            
            # Set default role for existing users to 'user'
            connection.execute(text(f"""
                UPDATE users SET role_id = {user_role_id}
                WHERE role_id IS NULL
            """))
            
            connection.commit()
            logger.info("Migration completed successfully!")
            
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration() 