# Update School After Registration

## Overview
Users can now link or update their driving school after registration. This allows users who skipped school selection during registration to add it later, or change their school if needed.

## Backend API

### Endpoint
```
PUT /api/users/:userId/school
Authorization: Bearer <token>
```

### Request Body
```json
{
  "drivingSchoolId": "sch-001"  // or null to unlink
}
```

### Response
```json
{
  "success": true,
  "message": "School linked successfully"
}
```

### Error Responses
- `401` - No authorization header
- `403` - Unauthorized (token doesn't match user)
- `404` - School not found
- `500` - Server error

## Android Implementation

### API Service
Added method to `DerevaApiService.kt`:
```kotlin
@PUT("/api/users/{id}/school")
suspend fun updateUserSchool(
    @Path("id") userId: String,
    @Body request: UpdateSchoolRequest,
    @Header("Authorization") token: String
): Response<MessageResponse>
```

### Repository
Added method to `SchoolRepository.kt`:
```kotlin
suspend fun updateUserSchool(userId: String, schoolId: String?): Result<Unit>
```

### ViewModel
Added method to `AuthViewModel.kt`:
```kotlin
fun updateUserSchool(schoolId: String?)
```

This method:
- Updates the school via API
- Updates local user state
- Shows success/error messages

### Usage Example

```kotlin
// In a composable (e.g., ProfileScreen or SettingsScreen)
val viewModel: AuthViewModel = koinViewModel()
val uiState by viewModel.uiState.collectAsState()

// Load schools
LaunchedEffect(Unit) {
    viewModel.loadSchools()
}

// Show school selection dialog
if (showSchoolDialog) {
    SchoolSelectionDialog(
        schools = uiState.schools,
        onSchoolSelected = { school ->
            viewModel.updateUserSchool(school.id)
            showSchoolDialog = false
        },
        onDismiss = { showSchoolDialog = false }
    )
}

// To unlink school
Button(onClick = { viewModel.updateUserSchool(null) }) {
    Text("Unlink School")
}
```

## UI Integration Points

### Where to Add School Selection

1. **Profile/Settings Screen** (Recommended)
   - Add a "Driving School" section
   - Show current school or "Not linked"
   - Button to "Select School" or "Change School"
   - Button to "Unlink School" if linked

2. **Home Screen**
   - Show banner if user not linked to school
   - "Link to your driving school" CTA

3. **After First Quiz**
   - Prompt user to link school for progress sharing
   - "Your school can track your progress"

## Example UI Component

```kotlin
@Composable
fun SchoolSection(
    currentSchool: DrivingSchool?,
    onSelectSchool: () -> Unit,
    onUnlinkSchool: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Driving School", style = MaterialTheme.typography.titleMedium)
            
            Spacer(modifier = Modifier.height(8.dp))
            
            if (currentSchool != null) {
                Text(currentSchool.name, style = MaterialTheme.typography.bodyLarge)
                Text(currentSchool.location, style = MaterialTheme.typography.bodySmall)
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row {
                    Button(onClick = onSelectSchool) {
                        Text("Change School")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedButton(onClick = onUnlinkSchool) {
                        Text("Unlink")
                    }
                }
            } else {
                Text("Not linked to any school", color = MaterialTheme.colorScheme.onSurfaceVariant)
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Button(onClick = onSelectSchool) {
                    Text("Select School")
                }
            }
        }
    }
}
```

## Benefits

1. **Flexibility**: Users can skip during registration and add later
2. **Correction**: Users can fix mistakes in school selection
3. **Privacy**: Users can unlink if they change schools
4. **Progress Sharing**: Once linked, quiz progress is automatically shared

## Testing

1. Register user without school
2. Call update school API with school ID
3. Verify `driving_school_id` updated in database
4. Complete a quiz
5. Verify progress appears in school dashboard
6. Call update school API with `null`
7. Verify school unlinked

## Security

- Requires authentication (Bearer token)
- User can only update their own school
- School ID is validated (must exist in database)
- No rate limiting (consider adding if abused)

## Future Enhancements

- [ ] School approval workflow (school must approve student)
- [ ] Transfer history (track school changes)
- [ ] Bulk school linking (for school admins)
- [ ] School invitation codes
- [ ] Notification to school when student links
