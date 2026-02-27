# School Selection API - Backend Implementation

## Overview
Backend API updates to support optional school selection during user registration and school listing for the Android app.

## Changes Made

### 1. Registration Endpoint Update

**File: `src/routes/auth.ts`**

#### Schema Update
```typescript
const registerSchema = z.object({
  phoneNumber: z.string().regex(/^(254|0)[17]\d{8}$/),
  password: z.string().min(6),
  name: z.string().min(2),
  licenseCategory: z.enum(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C', 'D', 'E', 'F', 'G']),
  drivingSchoolId: z.string().optional(), // NEW: Optional school ID
});
```

#### Database Insert Update
- Added `driving_school_id` field to user creation
- Field is nullable - defaults to `null` if not provided
- Validates school ID exists if provided (foreign key constraint)

### 2. Schools Listing Endpoint Update

**File: `src/routes/schools.ts`**

#### New Query Parameter
- `verified=true` - Filter to show only verified schools
- Used by Android app to show only trusted schools

#### Response Format
Updated to match Android app's `DrivingSchool` model:

```json
{
  "schools": [
    {
      "id": "sch-001",
      "name": "AA Kenya Driving School",
      "code": "DS-001-2020",
      "location": "Nairobi, Nairobi",
      "phoneNumber": "254712345678",
      "email": "info@aakenya.co.ke",
      "isVerified": true,
      "totalStudents": 0,
      "averagePassRate": 0.0,
      "createdAt": 1771951234000
    }
  ]
}
```

**Field Mappings:**
- `code` ← `registration_number`
- `location` ← Combined `town, county`
- `phoneNumber` ← `phone_number`
- `isVerified` ← `is_verified`

## API Endpoints

### 1. Register User (Updated)

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "phoneNumber": "0712345678",
  "password": "securepass123",
  "name": "John Doe",
  "licenseCategory": "B1",
  "drivingSchoolId": "sch-001"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "phoneNumber": "254712345678",
    "name": "John Doe",
    "targetCategory": "B1",
    "subscriptionStatus": "FREE",
    "isPhoneVerified": false
  },
  "token": "jwt-token"
}
```

### 2. List Schools

**Endpoint:** `GET /api/schools?verified=true`

**Query Parameters:**
- `verified` (optional) - Filter by verification status
  - `true` - Only verified schools
  - `false` - Only unverified schools
  - omit - All schools
- `county` (optional) - Filter by county name

**Response:**
```json
{
  "schools": [
    {
      "id": "sch-001",
      "name": "AA Kenya Driving School",
      "code": "DS-001-2020",
      "location": "Nairobi, Nairobi",
      "phoneNumber": "254712345678",
      "email": "info@aakenya.co.ke",
      "isVerified": true,
      "totalStudents": 0,
      "averagePassRate": 0.0,
      "createdAt": 1771951234000
    }
  ]
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    target_category TEXT NOT NULL,
    driving_school_id TEXT,  -- NEW: Optional school link
    subscription_status TEXT NOT NULL DEFAULT 'FREE',
    is_phone_verified INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,
    FOREIGN KEY (driving_school_id) REFERENCES schools(id)
);
```

### Schools Table
```sql
CREATE TABLE schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    county TEXT,
    town TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    commission_rate REAL NOT NULL DEFAULT 0.15,
    total_branches INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

## Commission Tracking

When a user with a `driving_school_id` makes a payment:

1. **Automatic Commission Creation**
   - Triggered on payment completion
   - Commission amount = payment × school's commission rate
   - Status starts as 'PENDING'

2. **Commission Record**
```sql
INSERT INTO school_commissions (
    id, school_id, payment_id, user_id,
    payment_amount, commission_rate, commission_amount,
    status, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?);
```

## Testing

### Test School Selection
```bash
# 1. Get verified schools
curl "https://dereva-smart-backend.pngobiro.workers.dev/api/schools?verified=true"

# 2. Register with school
curl -X POST "https://dereva-smart-backend.pngobiro.workers.dev/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0712345678",
    "password": "test123",
    "name": "Test User",
    "licenseCategory": "B1",
    "drivingSchoolId": "sch-001"
  }'

# 3. Register without school
curl -X POST "https://dereva-smart-backend.pngobiro.workers.dev/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0712345679",
    "password": "test123",
    "name": "Test User 2",
    "licenseCategory": "B1"
  }'
```

## Security Considerations

1. **School Verification**
   - Only verified schools shown to users by default
   - Prevents fraudulent school associations

2. **Optional Field**
   - School selection is not mandatory
   - Users can register without school affiliation
   - No impact on app functionality

3. **Foreign Key Constraint**
   - Validates school ID exists if provided
   - Prevents invalid school associations

4. **Commission Protection**
   - Commissions only created for completed payments
   - School must be verified to receive commissions
   - Admin approval required for commission payouts

## Future Enhancements

1. **School Invitation Codes**
   - Schools can generate invitation codes
   - Students enter code during registration
   - Automatic school linking

2. **Branch Selection**
   - Allow users to select specific branch
   - Track students per branch
   - Branch-level analytics

3. **School Transfer**
   - Allow users to change schools
   - Transfer history tracking
   - Commission adjustments

4. **Bulk Student Import**
   - Schools can upload student lists
   - Automatic account creation
   - Invitation emails/SMS

## Deployment

Backend deployed to: `https://dereva-smart-backend.pngobiro.workers.dev`

**Endpoints:**
- Registration: `POST /api/auth/register`
- Schools List: `GET /api/schools?verified=true`
- School Details: `GET /api/schools/:id`

All endpoints are live and ready for Android app integration.
