# Supabase Migrations

This folder contains SQL migrations for your Supabase database.

## How to Run Migrations

### Via Supabase Dashboard (Easiest)
1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Open the migration file you want to run
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click **Run** button

### Via Supabase CLI
If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations to your database
supabase db push
```

## Available Migrations

### 001_create_profile_trigger.sql
**Purpose:** Automatically creates profile records when users sign up

**What it does:**
- Creates a trigger function `handle_new_user()`
- Creates a trigger that fires after user signup
- Automatically populates the `profiles` table with user metadata
- Sets up Row Level Security (RLS) policies

**When to run:** Before allowing users to sign up in your application

**Dependencies:** Requires the `public.profiles` table to exist

---

## Migration Best Practices

1. **Always run migrations in order** (001, 002, 003, etc.)
2. **Back up your database** before running migrations in production
3. **Test migrations in development** first
4. **Never modify a migration** that has already been run in production
5. **Create a new migration** for any database changes

---

## Checking if a Migration Ran Successfully

After running a migration, you can verify it worked:

### Check if trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Check if function exists:
```sql
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

### Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- SQL Editor Guide: https://supabase.com/docs/guides/database/overview
- Triggers Guide: https://supabase.com/docs/guides/database/functions
