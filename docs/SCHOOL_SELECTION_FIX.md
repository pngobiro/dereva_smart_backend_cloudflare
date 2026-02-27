# School Selection Fix - "Schools Not Available" Issue

## Problem
The Android app was showing "schools not available" when users tried to select a driving school during registration.

## Root Causes

1. **Backend Response Format Mismatch**
   - Backend was returning: `{ schools: [...] }`
   - Android app expected: `[...]` (direct array)

2. **Android App Not Loading Schools**
   - RegisterScreen had a TODO comment but wasn't actually calling the API
   - No function in AuthViewModel to load schools
   - SchoolRepository wasn't injected into AuthViewModel

## Solutions Implemented

### Backend Changes (`src/routes/schools.ts`)

Changed response format to return array directly:

```typescript
// Before
return c.json({ schools });

// After
return c.json(schools);
```

Updated response fields to match Android DTO:
- `location` (combined town + county)
- `phone` (instead of phoneNumber)
- `verified` (instead of isVerified)
- Added `rating`, `license_types`, `price_range`

### Android App Changes

1. **AuthViewModel.kt**
   - Added `schools: List<DrivingSchool>` to `AuthUiState`
   - Added `isLoadingSchools: Boolean` to `AuthUiState`
   - Injected `SchoolRepository` dependency
   - Added `loadSchools()` function to fetch schools from API

2. **RegisterScreen.kt**
   - Removed local `schools` state
   - Added `LaunchedEffect` to call `viewModel.loadSchools()`
   - Updated dialog to use `uiState.schools`

3. **SchoolRepositoryImpl.kt**
   - Fixed mapping to use `dto.verified` instead of hardcoded `true`
   - Fixed `dto.phone` (was `dto.phone ?: ""`)

4. **DerevaApiService.kt**
   - Added `verified` query parameter (defaults to `true`)

5. **AppModule.kt**
   - Updated AuthViewModel factory to inject `SchoolRepository`

## Testing

Backend API now returns correct format:
```bash
curl "https://dereva-smart-backend.pngobiro.workers.dev/api/schools?verified=true"
```

Returns:
```json
[
  {
    "id": "sch-001",
    "name": "AA Kenya Driving School",
    "location": "Nairobi, Nairobi",
    "phone": "254712345678",
    "email": "info@aakenya.co.ke",
    "rating": 4.5,
    "license_types": ["B1", "B2", "C1"],
    "price_range": "KES 15,000 - 25,000",
    "verified": true
  }
]
```

## Result

✅ Backend deployed successfully
✅ API returns correct format
✅ Android app loads schools on registration screen
✅ No compilation errors
✅ School selection now works end-to-end
