# MedAI Hub Documentation

Welcome to the MedAI Hub documentation. This directory contains all technical documentation for the project.

## Quick Links

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System overview, tech stack, data flow |
| [API_REFERENCE.md](API_REFERENCE.md) | Complete API endpoint documentation |
| [AUTHENTICATION.md](AUTHENTICATION.md) | Auth setup, flows, security guide |
| [DATABASE.md](DATABASE.md) | Schema docs, tables, RLS policies |

## SQL Files

| File | Description |
|------|-------------|
| [schema.sql](schema.sql) | Database schema - run first |
| [rls_policies.sql](rls_policies.sql) | Row Level Security policies |

## Getting Started

### 1. Database Setup

```bash
# In Supabase Dashboard SQL Editor:
# 1. Run schema.sql to create tables
# 2. Run rls_policies.sql to enable security
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```env
GOOGLE_API_KEY=your-key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1  # Windows
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Additional Resources

- **Project README**: See root `CLAUDE.md` for development commands and patterns
- **Supabase Dashboard**: Manage database, auth, and storage
- **API Docs**: http://localhost:8000/api/docs (when backend running)

## Contributing

When updating documentation:
1. Keep docs up-to-date with code changes
2. Use consistent formatting
3. Include code examples where helpful
4. Update this README if adding new docs
