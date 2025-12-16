# Clean Install Required

The Supabase import error requires a clean reinstall of dependencies. The code has been fixed, but you need to reinstall packages.

## Quick Fix Steps

### Step 1: Stop the dev server
Press `Ctrl+C` in the terminal where `npm run dev` is running.

### Step 2: Delete old files
Run these commands (choose based on your terminal):

**PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules, .next -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

**Command Prompt (cmd):**
```cmd
rmdir /s /q node_modules 2>nul
rmdir /s /q .next 2>nul
del package-lock.json 2>nul
```

**Git Bash / WSL:**
```bash
rm -rf node_modules .next package-lock.json
```

### Step 3: Reinstall
```bash
npm install
```

### Step 4: Restart dev server
```bash
npm run dev
```

## What Was Fixed

1. ✅ Removed dependency on `@supabase/ssr` (was causing import errors)
2. ✅ Updated client to use `createClient` directly from `@supabase/supabase-js`
3. ✅ Updated server to use `createClient` directly (no SSR package needed)
4. ✅ Added webpack config to handle ESM module resolution
5. ✅ Changed root page to client component to avoid server import issues

## If PowerShell Blocks npm

If you get execution policy errors, run this first:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Or use Command Prompt instead of PowerShell.

## After Reinstall

The error should be completely resolved. The app will:
- Load without import errors
- Use Supabase client properly
- Handle authentication correctly

If you still see errors after clean install, let me know!

