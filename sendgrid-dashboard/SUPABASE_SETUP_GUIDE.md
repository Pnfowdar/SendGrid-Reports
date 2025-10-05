# Supabase Setup Guide for Next.js

## ✅ Working Configuration

This guide documents the **correct** way to integrate Supabase with Next.js API routes, based on resolving authentication issues.

---

## The Problem We Solved

### ❌ What Doesn't Work

```typescript
// DON'T DO THIS - Causes "Invalid API key" errors
import { createClient } from "@supabase/supabase-js";

const client = createClient<{ MyTable: MyType }>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

**Why it fails:**
- Generic type parameters (`<{ MyTable: MyType }>`) interfere with Supabase's internal authentication flow
- TypeScript generates incorrect types that conflict with JWT validation
- Results in "Invalid API key" errors even with valid credentials

### ✅ What Works

```typescript
// DO THIS - Let Supabase infer types naturally
import { createClient } from "@supabase/supabase-js";

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'supabase-js-node',
      },
    },
  }
);
```

**Why it works:**
- No generic type constraints - Supabase handles types internally
- Explicit `db.schema: 'public'` ensures correct schema targeting
- Standard headers match other tools (like n8n)
- Minimal auth config for server-side usage

---

## Environment Variables Setup

### Required Variables

Create `.env.local` with these exact variable names:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where to Get These Values

1. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE`

### Variable Naming Rules

- ✅ Use `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
- ✅ Use `SUPABASE_SERVICE_ROLE` (not `SUPABASE_SERVICE_ROLE_KEY`)
- ✅ Keep `NEXT_PUBLIC_` prefix for client-accessible vars
- ✅ No prefix for server-only secrets

---

## Implementation Pattern

### 1. Create Supabase Client Utility

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials missing");
  }

  // CRITICAL: No generic type parameters!
  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-node',
        },
      },
    }
  );
}
```

### 2. Use in API Routes

```typescript
// src/app/api/data/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
```

---

## Troubleshooting

### "Invalid API key" Error

**Symptoms:**
- Error message: `Invalid API key`
- Hint: `Double check your Supabase 'anon' or 'service_role' API key`

**Solutions:**
1. ✅ Remove generic type parameters from `createClient()`
2. ✅ Verify env vars are loaded: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`
3. ✅ Restart dev server after changing `.env.local`
4. ✅ Check keys work in another tool (e.g., n8n, Postman)
5. ✅ Ensure `db.schema: 'public'` is set

### Environment Variables Not Loading

**Symptoms:**
- `process.env.NEXT_PUBLIC_SUPABASE_URL` is `undefined`

**Solutions:**
1. ✅ File must be named `.env.local` (not `.env`)
2. ✅ File must be in project root (next to `package.json`)
3. ✅ Restart dev server: `npm run dev`
4. ✅ Check for typos in variable names

### Table Not Found

**Symptoms:**
- Error: `relation "your_table" does not exist`

**Solutions:**
1. ✅ Verify table exists in Supabase dashboard
2. ✅ Check table name spelling (case-sensitive)
3. ✅ Ensure `db.schema: 'public'` is set
4. ✅ If using quotes in SQL, use double quotes: `"Table_Name"`

---

## Key Takeaways

1. **Never use generic type parameters** with `createClient()` in Next.js API routes
2. **Always specify `db.schema: 'public'`** explicitly
3. **Use `NEXT_PUBLIC_` prefix** for client-accessible variables
4. **Keep service_role key server-side only** (never expose to browser)
5. **Test keys in another tool** (n8n, Postman) to verify they're valid

---

## Testing Your Setup

### Quick Test Script

```typescript
// test-supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    db: { schema: 'public' },
  }
);

async function test() {
  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .limit(1);

  console.log({ data, error });
}

test();
```

Run: `npx tsx test-supabase.ts`

---

## Additional Resources

- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)

---

**Last Updated:** October 5, 2025  
**Status:** ✅ Verified Working Configuration
