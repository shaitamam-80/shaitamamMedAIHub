# MedAI Hub - Authentication Guide

## Overview

MedAI Hub uses Supabase Authentication for user management. The system supports email/password authentication with JWT-based session management.

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Supabase  │────▶│   Backend   │
│  (Next.js)  │◀────│    Auth     │◀────│  (FastAPI)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. User signs up/signs in via frontend
2. Supabase returns JWT token
3. Frontend stores token in cookies
4. Frontend sends token with API requests
5. Backend validates token with Supabase
6. Backend extracts user_id for data isolation

## Frontend Setup

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Client

Located at `frontend/lib/supabase.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Auth Context

The `AuthProvider` (`frontend/contexts/auth-context.tsx`) wraps the application and provides:

- `user` - Current user object or null
- `session` - Current session or null
- `loading` - Authentication state loading
- `signIn(email, password)` - Sign in method
- `signUp(email, password)` - Sign up method
- `signOut()` - Sign out method

### Protected Routes

Middleware (`frontend/middleware.ts`) protects routes:

```typescript
// Protected paths that require authentication
const protectedPaths = ['/define', '/query', '/review', '/projects']

// Auth paths that should redirect to /define if logged in
const authPaths = ['/auth/login', '/auth/register']
```

## Backend Setup

### Environment Variables

```env
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional
```

### JWT Validation

Located at `backend/app/core/auth.py`:

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserPayload:
    token = credentials.credentials

    # Validate with Supabase
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_KEY
            }
        )

        if response.status_code == 200:
            user_data = response.json()
            return UserPayload(
                id=user_data["id"],
                email=user_data.get("email")
            )

    raise HTTPException(status_code=401, detail="Invalid token")
```

### Protecting Routes

```python
from app.core.auth import get_current_user, UserPayload

@router.get("/protected-endpoint")
async def protected_endpoint(
    current_user: UserPayload = Depends(get_current_user)
):
    # current_user.id contains the authenticated user's UUID
    return {"user_id": current_user.id}
```

## Database Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
1. Filter SELECT to user's own data
2. Restrict INSERT to set correct user_id
3. Limit UPDATE/DELETE to user's own records

See `docs/rls_policies.sql` for complete policies.

### User Ownership Pattern

All data operations verify ownership:

```python
# Example: Get project with ownership check
async def get_project(project_id: str, user_id: str):
    response = supabase.table("projects") \
        .select("*") \
        .eq("id", project_id) \
        .eq("user_id", user_id) \
        .single() \
        .execute()
    return response.data
```

## User Registration Flow

1. User fills registration form
2. Frontend calls `supabase.auth.signUp()`
3. Supabase creates user in `auth.users`
4. User receives confirmation email (if enabled)
5. After confirmation, user can sign in

## User Login Flow

1. User enters credentials
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase validates and returns session
4. Session stored in cookies
5. User redirected to `/define`

## Session Management

### Cookie Storage

Sessions are stored in HTTP-only cookies for security:
- `sb-<project-ref>-auth-token` - Access token
- Managed by `@supabase/ssr`

### Token Refresh

Supabase automatically handles token refresh:
- Access tokens expire after 1 hour
- Refresh tokens last 1 week (configurable)
- `@supabase/ssr` handles refresh automatically

## Sign Out

```typescript
const { signOut } = useAuth()

// Signs out and clears session
await signOut()
// User redirected to login page
```

## Error Handling

### Common Auth Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid login credentials` | Wrong email/password | Verify credentials |
| `Email not confirmed` | Unverified email | Check inbox for confirmation |
| `User already registered` | Duplicate email | Use different email or sign in |
| `Missing authentication token` | No Bearer token | Ensure logged in |
| `Invalid token` | Expired or invalid JWT | Re-authenticate |

## Security Best Practices

1. **Never expose service role key** - Only use on server-side
2. **Use HTTPS in production** - Protect tokens in transit
3. **Enable email confirmation** - Verify user emails
4. **Implement rate limiting** - Prevent brute force
5. **Monitor auth logs** - Track suspicious activity

## Supabase Dashboard Settings

### Email Templates
Customize in: Authentication → Email Templates

### Auth Providers
Enable/disable in: Authentication → Providers

### Session Settings
Configure in: Authentication → URL Configuration
- Site URL: Your production URL
- Redirect URLs: Allowed callback URLs
