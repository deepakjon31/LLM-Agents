# Admin Panel & Role-Based Access Control

This document provides information about the Admin Panel and the Role-Based Access Control (RBAC) system.

## Roles Overview

The system has the following user roles:

1. **Admin**: Full system access with all permissions
2. **Developer**: Technical access to databases, code, and technical features
3. **Analyst**: Access to data analysis features and read-only access to databases
4. **User**: Standard user with basic access to chat and documents

## Permissions by Role

### Admin Role
- Manage users (create, update, delete)
- Manage roles and permissions
- Manage database connections
- View admin dashboard
- All permissions of lower roles

### Developer Role
- Create and manage database connections
- Upload and manage documents
- Create and manage chat sessions
- Query databases

### Analyst Role
- View and query databases (read-only)
- View documents
- Use chat functionality for analysis

### User Role
- View documents
- Use chat functionality

## Database Connection Management

**Important**: Only Admin and Developer roles are permitted to add and manage database connections.

## Setting Up the Admin Panel

### 1. Run Database Migrations

Execute the role migration script to set up the RBAC tables:

```bash
# Give execute permission to the script
chmod +x scripts/run_role_migrations.sh

# Run the migration script
./scripts/run_role_migrations.sh
```

### 2. Creating Initial Admin User

The first user must be upgraded to admin role using the following SQL:

```sql
-- Find the ID of the 'admin' role
SELECT id FROM roles WHERE name = 'admin';

-- Update a user to have the admin role (replace user_id and role_id)
UPDATE users SET role_id = <admin_role_id> WHERE id = <user_id>;
```

### 3. Admin Panel Features

The admin panel includes:

- **Dashboard**: Overview of system activity
- **User Management**: Create, update, and delete users
- **Role Management**: Assign roles and permissions to users
- **Database Control**: Manage database connections
- **Permission Management**: Configure fine-grained permissions

## Adding the Admin Panel to an Existing Page

To add an admin panel to a page, use the following components:

```jsx
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import RoleManagement from '@/components/admin/RoleManagement';
import PermissionManagement from '@/components/admin/PermissionManagement';
import DatabaseControl from '@/components/admin/DatabaseControl';
```

## Checking User Permissions in Frontend

```jsx
// In a React component
const { data: session } = useSession();
const [userPermissions, setUserPermissions] = useState([]);

useEffect(() => {
  // Fetch user profile with permissions
  const fetchUserProfile = async () => {
    const response = await fetch('/api/profile/me');
    const data = await response.json();
    setUserPermissions(data.permissions || []);
  };
  
  if (session) {
    fetchUserProfile();
  }
}, [session]);

// Check if user has a specific permission
const hasPermission = (permission) => {
  return userPermissions.includes(permission);
};

// Usage
{hasPermission('manage_databases') && (
  <button>Add Database</button>
)}
```

## Checking User Permissions in Backend

The backend includes several utility functions for checking permissions:

```python
# Using a dependency
@router.post("/some-endpoint")
async def some_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("required_permission"))
):
    # If user doesn't have the permission, the request will fail with 403
    return {"message": "You have access!"}

# Using a decorator
@router.post("/another-endpoint")
@requires_permissions(["permission1", "permission2"])
async def another_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # User needs at least one of the specified permissions
    return {"message": "You have access!"}

# Checking a specific role
@router.post("/admin-only-endpoint")
async def admin_only_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_role("admin"))
):
    # Only admin users can access this endpoint
    return {"message": "Admin access granted!"}
```

## Showing User Roles in the UI

The user's role is displayed in:

1. The profile page
2. The top navigation bar
3. Account settings

## Troubleshooting

If you encounter issues with permissions:

1. Check that the migration script has been run successfully
2. Verify the user has been assigned the correct role
3. Ensure all permissions are properly assigned to roles
4. Look at the server logs for authorization failures 