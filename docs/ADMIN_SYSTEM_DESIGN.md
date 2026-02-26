# Admin System Design - Role-Based Access Control

## Overview
The Dereva Smart platform has a multi-tier admin system with role-based access control (RBAC) to manage the platform, schools, and instructors.

## User Roles

### 1. Super Admin (Platform Owner)
**Role:** `SUPER_ADMIN`

**Who:** Dereva Smart proprietor and authorized platform administrators

**Permissions:**
- ✅ Manage all schools (create, update, delete, verify)
- ✅ Manage all admin users (create school admins, instructors)
- ✅ Manage platform content (modules, lessons, questions)
- ✅ View all payments and financial reports
- ✅ View platform-wide analytics
- ✅ Manage system settings and configurations
- ✅ Access all data across all schools
- ✅ Manage commission rates
- ✅ Approve/reject school registrations
- ✅ Suspend/activate schools

**Access:** Web dashboard at `admin.derevasmart.com`

### 2. School Admin
**Role:** `SCHOOL_ADMIN`

**Who:** School owners, managers, or authorized school staff

**Permissions:**
- ✅ Manage their school's instructors (add, update, remove)
- ✅ View their school's students
- ✅ Manage school license categories
- ✅ View school analytics and reports
- ✅ Manage school settings (contact info, address)
- ✅ Generate student link codes
- ✅ View payment history for their school
- ❌ Cannot access other schools' data
- ❌ Cannot modify platform content
- ❌ Cannot change commission rates

**Access:** Web dashboard at `school.derevasmart.com` or mobile app

### 3. Instructor
**Role:** `INSTRUCTOR`

**Who:** Driving instructors employed by schools

**Permissions:**
- ✅ View assigned students
- ✅ Update student progress
- ✅ View their schedule
- ✅ Mark lessons as completed
- ✅ Add notes to student records
- ❌ Cannot manage other instructors
- ❌ Cannot view financial data
- ❌ Cannot modify school settings
- ❌ Cannot access students not assigned to them

**Access:** Mobile app (instructor version)

### 4. Learner (Student)
**Role:** `LEARNER`

**Who:** Students learning to drive

**Permissions:**
- ✅ Access learning content
- ✅ Take mock tests
- ✅ View their own progress
- ✅ Make payments
- ✅ Link to schools
- ❌ No admin access

**Access:** Mobile app (learner version)

## Database Schema

### admin_users Table
```sql
CREATE TABLE admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL,              -- SUPER_ADMIN, SCHOOL_ADMIN, INSTRUCTOR
    school_id TEXT,                  -- NULL for SUPER_ADMIN, required for others
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    created_by TEXT,                 -- Admin who created this account
    last_login_at INTEGER
);
```

### admin_roles Table
```sql
CREATE TABLE admin_roles (
    id TEXT PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT NOT NULL,       -- JSON array of permissions
    created_at INTEGER NOT NULL
);
```

### admin_activity_log Table
```sql
CREATE TABLE admin_activity_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,            -- CREATE_SCHOOL, UPDATE_INSTRUCTOR, etc.
    entity_type TEXT,                -- school, instructor, content, etc.
    entity_id TEXT,
    details TEXT,                    -- JSON with action details
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
);
```

## API Endpoints

### Super Admin Endpoints

#### Authentication
```
POST /api/admin/auth/login
POST /api/admin/auth/logout
POST /api/admin/auth/refresh
```

#### School Management
```
GET    /api/admin/schools                    # List all schools
POST   /api/admin/schools                    # Create new school
GET    /api/admin/schools/:id                # Get school details
PUT    /api/admin/schools/:id                # Update school
DELETE /api/admin/schools/:id                # Delete school
POST   /api/admin/schools/:id/verify         # Verify school
POST   /api/admin/schools/:id/suspend        # Suspend school
POST   /api/admin/schools/:id/activate       # Activate school
PUT    /api/admin/schools/:id/commission     # Update commission rate
```

#### Admin User Management
```
GET    /api/admin/users                      # List all admin users
POST   /api/admin/users                      # Create admin user
GET    /api/admin/users/:id                  # Get admin details
PUT    /api/admin/users/:id                  # Update admin
DELETE /api/admin/users/:id                  # Delete admin
POST   /api/admin/users/:id/reset-password   # Reset password
```

#### Content Management
```
GET    /api/admin/content/modules            # List modules
POST   /api/admin/content/modules            # Create module
PUT    /api/admin/content/modules/:id        # Update module
DELETE /api/admin/content/modules/:id        # Delete module
POST   /api/admin/content/modules/:id/media  # Upload media
```

#### Analytics & Reports
```
GET    /api/admin/analytics/overview         # Platform overview
GET    /api/admin/analytics/schools          # School performance
GET    /api/admin/analytics/revenue          # Revenue reports
GET    /api/admin/analytics/users            # User statistics
GET    /api/admin/reports/payments           # Payment reports
GET    /api/admin/reports/commissions        # Commission reports
```

### School Admin Endpoints

#### Instructor Management
```
GET    /api/school/instructors               # List school instructors
POST   /api/school/instructors               # Add instructor
GET    /api/school/instructors/:id           # Get instructor details
PUT    /api/school/instructors/:id           # Update instructor
DELETE /api/school/instructors/:id           # Remove instructor
POST   /api/school/instructors/:id/categories # Add license category
```

#### Student Management
```
GET    /api/school/students                  # List school students
GET    /api/school/students/:id              # Get student details
POST   /api/school/students/:id/assign       # Assign to instructor
GET    /api/school/link-codes                # Generate link codes
POST   /api/school/link-codes                # Create new link code
```

#### School Settings
```
GET    /api/school/settings                  # Get school settings
PUT    /api/school/settings                  # Update settings
GET    /api/school/categories                # Get offered categories
POST   /api/school/categories                # Add category
DELETE /api/school/categories/:category      # Remove category
```

#### School Analytics
```
GET    /api/school/analytics/overview        # School overview
GET    /api/school/analytics/students        # Student statistics
GET    /api/school/analytics/revenue         # Revenue data
GET    /api/school/reports/payments          # Payment history
```

### Instructor Endpoints

#### Student Management
```
GET    /api/instructor/students              # List assigned students
GET    /api/instructor/students/:id          # Get student details
POST   /api/instructor/students/:id/progress # Update progress
POST   /api/instructor/students/:id/notes    # Add notes
```

#### Schedule
```
GET    /api/instructor/schedule              # View schedule
GET    /api/instructor/lessons               # Upcoming lessons
```

## Permission System

### Permission Codes
```typescript
enum Permission {
  // School Management
  MANAGE_SCHOOLS = 'manage_schools',
  VIEW_SCHOOLS = 'view_schools',
  
  // Admin Management
  MANAGE_ADMINS = 'manage_admins',
  VIEW_ADMINS = 'view_admins',
  
  // Content Management
  MANAGE_CONTENT = 'manage_content',
  VIEW_CONTENT = 'view_content',
  
  // Payment Management
  MANAGE_PAYMENTS = 'manage_payments',
  VIEW_PAYMENTS = 'view_payments',
  
  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_SCHOOL_ANALYTICS = 'view_school_analytics',
  
  // System
  MANAGE_SYSTEM = 'manage_system',
  
  // Instructor Permissions
  MANAGE_INSTRUCTORS = 'manage_instructors',
  VIEW_ASSIGNED_STUDENTS = 'view_assigned_students',
  UPDATE_STUDENT_PROGRESS = 'update_student_progress',
  
  // School Settings
  MANAGE_SCHOOL_SETTINGS = 'manage_school_settings',
}
```

### Role-Permission Matrix

| Permission | Super Admin | School Admin | Instructor |
|-----------|-------------|--------------|------------|
| manage_schools | ✅ | ❌ | ❌ |
| manage_admins | ✅ | ❌ | ❌ |
| manage_content | ✅ | ❌ | ❌ |
| manage_payments | ✅ | ❌ | ❌ |
| view_analytics | ✅ | ❌ | ❌ |
| manage_system | ✅ | ❌ | ❌ |
| manage_instructors | ✅ | ✅ | ❌ |
| manage_students | ✅ | ✅ | ❌ |
| view_school_analytics | ✅ | ✅ | ❌ |
| manage_school_settings | ✅ | ✅ | ❌ |
| view_assigned_students | ✅ | ✅ | ✅ |
| update_student_progress | ✅ | ✅ | ✅ |
| view_schedule | ✅ | ✅ | ✅ |

## Use Cases

### Use Case 1: Super Admin Creates New School

**Flow:**
1. Super admin logs into admin dashboard
2. Navigates to "Schools" → "Add New School"
3. Fills in school details:
   - Name: "Nairobi Driving Academy"
   - Registration: "DS-2024-001"
   - Contact info
   - Location
   - Commission rate: 15%
4. Selects license categories school will offer: B1, B2, C, D
5. Creates school admin account:
   - Email: admin@nairobidrivingacademy.com
   - Name: "John Kamau"
   - Role: SCHOOL_ADMIN
6. System sends welcome email with login credentials
7. Activity logged: "SUPER_ADMIN created school DS-2024-001"

**API Calls:**
```http
POST /api/admin/schools
Authorization: Bearer {super_admin_token}

{
  "name": "Nairobi Driving Academy",
  "registrationNumber": "DS-2024-001",
  "phoneNumber": "254712345678",
  "email": "info@nairobidrivingacademy.com",
  "address": "123 Kenyatta Avenue",
  "county": "Nairobi",
  "town": "Nairobi CBD",
  "commissionRate": 0.15,
  "licenseCategories": ["B1", "B2", "C", "D"],
  "adminUser": {
    "email": "admin@nairobidrivingacademy.com",
    "name": "John Kamau",
    "phoneNumber": "254723456789"
  }
}
```

### Use Case 2: School Admin Adds Instructor

**Flow:**
1. School admin logs into school dashboard
2. Navigates to "Instructors" → "Add Instructor"
3. Fills in instructor details:
   - Name: "Mary Wanjiku"
   - Phone: "254734567890"
   - License: "INS-2020-005"
4. Selects categories instructor can teach: B1, B2
5. Creates instructor account
6. System sends SMS with login credentials
7. Activity logged: "SCHOOL_ADMIN added instructor to school"

**API Calls:**
```http
POST /api/school/instructors
Authorization: Bearer {school_admin_token}

{
  "name": "Mary Wanjiku",
  "phoneNumber": "254734567890",
  "email": "mary@example.com",
  "instructorLicenseNumber": "INS-2020-005",
  "licenseCategories": ["B1", "B2"]
}
```

### Use Case 3: Instructor Updates Student Progress

**Flow:**
1. Instructor logs into mobile app
2. Views list of assigned students
3. Selects student "Peter Omondi"
4. Marks lesson "Parking Techniques" as completed
5. Adds note: "Good progress, needs more practice with parallel parking"
6. Updates hours: +2 hours
7. Activity logged: "INSTRUCTOR updated student progress"

**API Calls:**
```http
POST /api/instructor/students/student-123/progress
Authorization: Bearer {instructor_token}

{
  "lessonId": "lesson-456",
  "status": "COMPLETED",
  "hoursCompleted": 2,
  "notes": "Good progress, needs more practice with parallel parking"
}
```

## Security

### Authentication
- JWT tokens with role embedded
- Separate token expiry for different roles:
  - Super Admin: 8 hours
  - School Admin: 12 hours
  - Instructor: 24 hours
- Refresh tokens stored in KV

### Authorization Middleware
```typescript
async function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    const user = c.get('adminUser');
    const role = await getRole(user.role);
    
    if (!role.permissions.includes(permission)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    await next();
  };
}
```

### Data Isolation
- School admins can only access their school's data
- Instructors can only access assigned students
- SQL queries include school_id filter automatically
- Super admin bypasses filters

### Activity Logging
- All admin actions logged
- Includes: who, what, when, where (IP)
- Immutable audit trail
- Retention: 2 years

## Initial Setup

### Creating First Super Admin

Run migration script:
```sql
INSERT INTO admin_users (
  id, email, password_hash, name, role, 
  is_active, created_at
) VALUES (
  'admin-001',
  'admin@derevasmart.com',
  '$2a$10$...', -- bcrypt hash
  'Platform Administrator',
  'SUPER_ADMIN',
  1,
  strftime('%s', 'now') * 1000
);
```

Or use CLI command:
```bash
npm run create-super-admin -- \
  --email admin@derevasmart.com \
  --name "Platform Administrator" \
  --password "SecurePassword123!"
```

## Dashboard Features

### Super Admin Dashboard
- **Overview Cards:**
  - Total schools
  - Total students
  - Total revenue
  - Active subscriptions
  
- **Recent Activity:**
  - New school registrations
  - Payment transactions
  - System alerts

- **Quick Actions:**
  - Add new school
  - Create admin user
  - Upload content
  - View reports

### School Admin Dashboard
- **Overview Cards:**
  - Total students
  - Active instructors
  - This month's revenue
  - Completion rate

- **Recent Activity:**
  - New student enrollments
  - Lesson completions
  - Payment received

- **Quick Actions:**
  - Add instructor
  - Generate link code
  - View students
  - View reports

### Instructor Dashboard
- **Overview Cards:**
  - Assigned students
  - Today's lessons
  - Completed hours
  - Pending tasks

- **Student List:**
  - Name, category, progress
  - Quick actions: Update progress, Add notes

- **Schedule:**
  - Upcoming lessons
  - Availability calendar

## Mobile App Considerations

### School Admin Mobile App
- Simplified version of web dashboard
- Focus on:
  - Student management
  - Instructor management
  - Quick reports
  - Notifications

### Instructor Mobile App
- Dedicated instructor interface
- Features:
  - Student list
  - Progress tracking
  - Lesson scheduling
  - Notes and feedback
  - Offline mode support

## Future Enhancements

1. **Multi-factor Authentication (MFA)**
   - SMS OTP for super admins
   - Email OTP for school admins

2. **Advanced Permissions**
   - Custom roles
   - Granular permissions
   - Time-based access

3. **Audit Reports**
   - Compliance reports
   - Activity summaries
   - Security alerts

4. **Notifications**
   - Email notifications
   - SMS alerts
   - Push notifications

5. **API Keys**
   - School API keys for integrations
   - Webhook support
   - Rate limiting per school
