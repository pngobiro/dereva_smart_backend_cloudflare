# School Multi-License Category Design

## Overview
Driving schools can offer training for multiple license categories. This document explains how the database and API handle this many-to-many relationship.

## Database Schema

### Core Tables

#### 1. `schools`
Main school information
```sql
- id: Unique identifier
- name: School name
- registration_number: Official registration (unique)
- phone_number: Contact number
- email: Contact email
- address: Physical address
- county: County location
- town: Town location
- is_verified: Verification status
- commission_rate: Commission percentage (default 15%)
- created_at, updated_at: Timestamps
```

#### 2. `school_license_categories`
License categories offered by each school (many-to-many)
```sql
- id: Unique identifier
- school_id: Reference to school
- license_category: Category code (A1, A2, B1, etc.)
- is_active: Whether school still offers this category
- created_at: Timestamp
```

**Example Data:**
```
School: "Nairobi Driving Academy"
Categories: B1, B2, C, D (Light vehicles, trucks, buses)

School: "Moto Masters"
Categories: A1, A2, A3 (All motorcycle categories)

School: "Complete Driving School"
Categories: A1, A2, B1, B2, C, D, E (Most categories)
```

#### 3. `school_instructors`
Instructors working at schools
```sql
- id: Unique identifier
- school_id: Reference to school
- name: Instructor name
- phone_number: Contact number
- email: Contact email
- instructor_license_number: Official instructor license
- is_active: Employment status
- created_at, updated_at: Timestamps
```

#### 4. `instructor_license_categories`
Categories each instructor can teach (many-to-many)
```sql
- id: Unique identifier
- instructor_id: Reference to instructor
- license_category: Category code
- is_active: Whether instructor still teaches this
- created_at: Timestamp
```

**Example Data:**
```
Instructor: "John Kamau"
School: "Nairobi Driving Academy"
Can teach: B1, B2 (Light vehicles only)

Instructor: "Mary Wanjiku"
School: "Nairobi Driving Academy"
Can teach: C, D (Trucks and buses)
```

#### 5. `school_links`
Links between students and schools for specific categories
```sql
- id: Unique identifier
- user_id: Reference to student
- school_id: Reference to school
- link_code: Unique linking code
- license_category: Specific category student is learning
- status: PENDING, ACTIVE, COMPLETED, CANCELLED
- linked_at: When link was activated
- created_at: Timestamp
```

**Key Point:** A student can be linked to the same school for multiple categories!

**Example:**
```
Student: "Peter Omondi"
School: "Complete Driving School"
Links:
  - Category B1 (Light vehicle) - COMPLETED
  - Category A2 (Motorcycle) - ACTIVE
```

#### 6. `student_instructor_assignments`
Assigns students to specific instructors
```sql
- id: Unique identifier
- user_id: Reference to student
- instructor_id: Reference to instructor
- school_id: Reference to school
- license_category: Category being taught
- assigned_at: Assignment date
- completed_at: Completion date (if finished)
- is_active: Current status
```

## API Endpoints

### School Management

#### Get School Details with Categories
```
GET /api/schools/:id
```

Response:
```json
{
  "id": "school-123",
  "name": "Nairobi Driving Academy",
  "registrationNumber": "DS-2024-001",
  "phoneNumber": "254712345678",
  "email": "info@nairobidrivingacademy.com",
  "address": "123 Kenyatta Avenue",
  "county": "Nairobi",
  "town": "Nairobi CBD",
  "isVerified": true,
  "commissionRate": 0.15,
  "licenseCategories": [
    {
      "category": "B1",
      "isActive": true,
      "instructorCount": 5
    },
    {
      "category": "B2",
      "isActive": true,
      "instructorCount": 3
    },
    {
      "category": "C",
      "isActive": true,
      "instructorCount": 2
    },
    {
      "category": "D",
      "isActive": true,
      "instructorCount": 2
    }
  ],
  "totalInstructors": 8,
  "totalStudents": 150
}
```

#### List Schools by Category
```
GET /api/schools?category=B1&county=Nairobi
```

Response:
```json
{
  "schools": [
    {
      "id": "school-123",
      "name": "Nairobi Driving Academy",
      "county": "Nairobi",
      "town": "Nairobi CBD",
      "offersCategory": true,
      "instructorCount": 5,
      "rating": 4.5,
      "studentCount": 150
    },
    {
      "id": "school-456",
      "name": "Complete Driving School",
      "county": "Nairobi",
      "town": "Westlands",
      "offersCategory": true,
      "instructorCount": 8,
      "rating": 4.7,
      "studentCount": 200
    }
  ]
}
```

#### Add License Category to School
```
POST /api/schools/:id/categories
```

Request:
```json
{
  "licenseCategory": "E",
  "isActive": true
}
```

#### Get School Instructors by Category
```
GET /api/schools/:id/instructors?category=B1
```

Response:
```json
{
  "instructors": [
    {
      "id": "instructor-1",
      "name": "John Kamau",
      "phoneNumber": "254712345678",
      "licenseNumber": "INS-2020-001",
      "categories": ["B1", "B2"],
      "activeStudents": 12,
      "isActive": true
    },
    {
      "id": "instructor-2",
      "name": "Jane Muthoni",
      "phoneNumber": "254723456789",
      "licenseNumber": "INS-2021-005",
      "categories": ["B1"],
      "activeStudents": 8,
      "isActive": true
    }
  ]
}
```

### Student-School Linking

#### Link Student to School for Specific Category
```
POST /api/schools/:id/link
```

Request:
```json
{
  "linkCode": "ABC123",
  "licenseCategory": "B1"
}
```

Response:
```json
{
  "success": true,
  "link": {
    "id": "link-789",
    "schoolId": "school-123",
    "schoolName": "Nairobi Driving Academy",
    "licenseCategory": "B1",
    "status": "ACTIVE",
    "linkedAt": 1704067200000
  }
}
```

#### Get Student's School Links
```
GET /api/users/me/school-links
```

Response:
```json
{
  "links": [
    {
      "id": "link-789",
      "school": {
        "id": "school-123",
        "name": "Nairobi Driving Academy"
      },
      "licenseCategory": "B1",
      "status": "ACTIVE",
      "instructor": {
        "id": "instructor-1",
        "name": "John Kamau"
      },
      "linkedAt": 1704067200000
    },
    {
      "id": "link-790",
      "school": {
        "id": "school-123",
        "name": "Nairobi Driving Academy"
      },
      "licenseCategory": "A2",
      "status": "PENDING",
      "linkedAt": 1704153600000
    }
  ]
}
```

## Use Cases

### Use Case 1: Student Learning Multiple Categories at Same School
**Scenario:** Peter wants to get both B1 (car) and A2 (motorcycle) licenses from the same school.

**Flow:**
1. Peter links to school with code for B1
2. Gets assigned instructor John (teaches B1)
3. Completes B1 training
4. Peter links to same school with new code for A2
5. Gets assigned instructor Mary (teaches A2)
6. Both links remain in system with different statuses

### Use Case 2: Student Switching Categories
**Scenario:** Sarah started with C (truck) but wants to switch to B1 (car).

**Flow:**
1. Sarah's C link status changes to CANCELLED
2. New B1 link created with new code
3. Gets assigned to different instructor
4. Progress tracked separately for each category

### Use Case 3: School Adding New Category
**Scenario:** School wants to start offering E (heavy truck) training.

**Flow:**
1. School admin adds E to school_license_categories
2. Hires/assigns instructors with E qualification
3. School now appears in searches for E category
4. Can accept students for E training

### Use Case 4: Instructor Teaching Multiple Categories
**Scenario:** Experienced instructor can teach B1, B2, and C.

**Flow:**
1. Instructor has 3 entries in instructor_license_categories
2. Can be assigned to students in any of these categories
3. School dashboard shows instructor availability per category
4. Students see instructor's qualifications when assigned

## Business Rules

1. **School-Category Relationship**
   - School must have at least one active category
   - Can add/remove categories anytime
   - Removing category doesn't delete historical data

2. **Instructor-Category Relationship**
   - Instructor must teach at least one category
   - Can only teach categories their school offers
   - Can be assigned to multiple students per category

3. **Student-School Linking**
   - Student can link to multiple schools
   - Student can have multiple links to same school (different categories)
   - Each link requires unique code
   - Link code is category-specific

4. **Commission Calculation**
   - Commission rate is per school, not per category
   - Applied to all payments from students linked to that school
   - Tracked separately for each category enrollment

## Dashboard Views

### School Admin Dashboard
- Total students per category
- Active instructors per category
- Revenue per category
- Completion rates per category
- Instructor utilization per category

### Instructor Dashboard
- Assigned students per category
- Schedule per category
- Performance metrics per category

### Student Dashboard
- Current school links
- Progress per category
- Assigned instructors per category
- Payment history per enrollment

## Migration from Single Category

If you have existing data with single category assumption:

```sql
-- Migrate existing schools to have their categories
INSERT INTO school_license_categories (id, school_id, license_category, is_active, created_at)
SELECT 
  lower(hex(randomblob(16))),
  id,
  'B1', -- Default category
  1,
  created_at
FROM schools;

-- Update existing school_links to include category
UPDATE school_links 
SET license_category = (
  SELECT target_category 
  FROM users 
  WHERE users.id = school_links.user_id
)
WHERE license_category IS NULL;
```

## Performance Considerations

1. **Indexes**
   - All foreign keys are indexed
   - Category fields are indexed for fast filtering
   - Composite indexes on (school_id, license_category)

2. **Caching**
   - School categories cached in KV
   - Instructor availability cached per category
   - Cache invalidated on updates

3. **Queries**
   - Use JOINs to fetch related data in single query
   - Pagination for large result sets
   - Filter by category early in query chain
