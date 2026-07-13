# Fix Installation Instructions

The Supabase import error is due to corrupted or incompatible node_modules. Follow these steps:

## Option 1: Clean Install (Recommended)

1. **Delete node_modules and package-lock.json:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   ```

2. **Clear Next.js cache:**
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **Reinstall dependencies:**
   ```powershell
   npm install
   ```

4. **Start dev server:**
   ```powershell
   npm run dev
   ```

## Option 2: If PowerShell Execution Policy Blocks npm

If you get execution policy errors, run this first:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then proceed with Option 1.

## Option 3: Use Command Prompt Instead

If PowerShell continues to have issues, use Command Prompt (cmd):

1. Open Command Prompt (not PowerShell)
2. Navigate to project directory
3. Run:
   ```cmd
   rmdir /s /q node_modules
   del package-lock.json
   rmdir /s /q .next
   npm install
   npm run dev
   ```

## What Was Fixed

1. ✅ Updated `package.json` to use `@supabase/ssr` instead of `@supabase/auth-helpers-nextjs`
2. ✅ Updated client-side code to use `createClient` directly (more stable)
3. ✅ Updated server-side code to use `@supabase/ssr` with proper cookie handling
4. ✅ Changed root page to client component to avoid server import issues
5. ✅ Added webpack config to handle module resolution

After reinstalling, the error should be resolved!

