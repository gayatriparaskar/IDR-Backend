# Admin Logic Flow Documentation

## Overview
Complete admin management system with role-based access control, user management, and authentication.

## Features Implemented

### 1. User Authentication
- **Login**: `/api/auth/login` - Email/password authentication
- **Get Current User**: `/api/auth/me` - Get logged-in user details
- **Update Password**: `/api/auth/update-password` - Change password
- **Logout**: `/api/auth/logout` - Logout user

### 2. User Management (Admin Only)
- **Get All Users**: `GET /api/users` - Paginated user list with search/filter
- **Get User by ID**: `GET /api/users/:id` - Get specific user details
- **Update User**: `PUT /api/users/:id` - Update user information
- **Delete User**: `DELETE /api/users/:id` - Delete user (admin can't delete self)
- **Register Admin**: `POST /api/users/register-admin` - Initial admin setup

### 3. Role Management
- **Update User Role**: `PUT /api/users/:id/role` - Change user role (admin/user)
- **Role Protection**: Admin cannot change their own role

### 4. User Status Management
- **Suspend User**: `PUT /api/users/:id/suspend` - Suspend/unsuspend users
- **Status Protection**: Admin cannot suspend themselves
- **Status Types**: `active`, `inactive`, `suspended`

### 5. Admin Dashboard
- **Dashboard Stats**: `GET /api/users/dashboard/stats` - Complete analytics
- **Statistics**: Total users, admins, regular users, recent registrations, total investment, properties, queries, blogs, team members

## Security Features

### Authentication
- JWT-based authentication
- Password hashing with bcryptjs
- Token expiration configurable
- Role-based access control

### Authorization
- **Protect Middleware**: All protected routes require authentication
- **Admin Middleware**: Admin-only routes require admin role
- **Self-Protection**: Admins cannot delete/suspend/change role of themselves

### Validation
- Input validation for all endpoints
- Role validation (only 'user', 'admin' allowed)
- Status validation (only 'active', 'inactive', 'suspended' allowed)
- Email uniqueness validation

## API Endpoints

### Authentication Routes
```
POST   /api/auth/login              - Login user
GET    /api/auth/me                - Get current user
PUT    /api/auth/update-password     - Update password
POST   /api/auth/logout            - Logout user
```

### User Management Routes
```
POST   /api/users/register-admin    - Register initial admin
GET    /api/users                  - Get all users (admin only)
GET    /api/users/:id              - Get user by ID (admin only)
PUT    /api/users/:id              - Update user (admin only)
DELETE /api/users/:id              - Delete user (admin only)
PUT    /api/users/:id/role        - Update user role (admin only)
PUT    /api/users/:id/suspend      - Suspend/unsuspend user (admin only)
GET    /api/users/dashboard/stats  - Dashboard stats (admin only)
```

## Usage Examples

### 1. Admin Login
```javascript
POST /api/auth/login
{
    "email": "admin@example.com",
    "password": "admin123"
}

Response:
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
        "_id": "64f8a9b2c4d1e4a8b8f7e",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "minimumInvestment": 50000
    }
}
```

### 2. Create User (Admin)
```javascript
POST /api/users
Authorization: Bearer <token>
{
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "minimumInvestment": 25000
}
```

### 3. Get Users with Pagination
```javascript
GET /api/users?page=1&limit=10&search=john&role=user
Authorization: Bearer <token>

Response:
{
    "success": true,
    "count": 25,
    "pagination": {
        "page": 1,
        "limit": 10,
        "totalPages": 3,
        "total": 25
    },
    "data": [...]
}
```

### 4. Update User Role
```javascript
PUT /api/users/64f8a9b2c4d1e4a8b8f7e/role
Authorization: Bearer <token>
{
    "role": "admin"
}
```

### 5. Suspend User
```javascript
PUT /api/users/64f8a9b2c4d1e4a8b8f7e/suspend
Authorization: Bearer <token>
{
    "suspended": true
}
```

### 6. Dashboard Statistics
```javascript
GET /api/users/dashboard/stats
Authorization: Bearer <token>

Response:
{
    "success": true,
    "data": {
        "totalUsers": 150,
        "totalAdmins": 5,
        "totalRegularUsers": 145,
        "recentUsers": [...],
        "totalInvestment": 3750000,
        "totalProperties": 25,
        "totalQueries": 89,
        "totalBlogs": 12,
        "totalTeamMembers": 8,
        "stats": {
            "adminPercentage": "3.3",
            "userPercentage": "96.7"
        }
    }
}
```

## Environment Variables Required

Add these to your `.env` file:
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d
ADMIN_REGISTER_KEY=your-admin-registration-key-here
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store JWT_SECRET** securely
3. **Use strong passwords** for admin accounts
4. **Implement rate limiting** on login endpoints
5. **Log admin actions** for audit trails
6. **Regular password updates** for security
7. **Validate all inputs** to prevent injection attacks

## Error Handling

All endpoints return consistent error format:
```javascript
{
    "success": false,
    "error": "Error message here"
}
```

## Next Steps

1. Add email notifications for admin actions
2. Implement audit logging system
3. Add rate limiting to auth endpoints
4. Create admin permission levels (super admin, admin, moderator)
5. Add user activity tracking
