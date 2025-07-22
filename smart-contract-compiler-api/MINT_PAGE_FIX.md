# Fix for Mint Pages Database Error

## Issue
You're encountering this error when creating mint pages:
```
❌ Erreur insertion: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'hero_image' column of 'mint_pages' in the schema cache"
}
```

## Root Cause
The `mint_pages` table in your Supabase database is missing the `hero_image` column that was recently added to support custom background images for mint pages.

## Solution

### Option 1: Add the Column via Supabase Dashboard (Recommended)

1. **Open your Supabase dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project

2. **Access SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy and paste this SQL command:
   ```sql
   ALTER TABLE mint_pages ADD COLUMN IF NOT EXISTS hero_image TEXT;
   ```
   - Click "RUN" to execute

4. **Verify the Column Was Added**
   - Run this verification query:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'mint_pages' 
     AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```
   - You should see `hero_image` with data type `text` in the results

### Option 2: Use the Provided Migration File

1. **Use the migration script**
   - Open `database-migration.sql` in this directory
   - Copy the entire content
   - Run it in your Supabase SQL Editor

## Code Changes Made

I've updated the mint pages API to handle missing columns gracefully:

1. **Column Detection**: The code now checks if the `hero_image` column exists before trying to use it
2. **Graceful Fallback**: If the column is missing, the mint page creation will continue without the hero image
3. **Logging**: Better error messages to help diagnose the issue

## Testing the Fix

1. **Run the SQL migration** (see above)
2. **Restart your API server** if it's running
3. **Try creating a mint page again**

The error should be resolved, and you should see this in your logs:
```
✅ Colonne hero_image présente
```

## What This Column Does

The `hero_image` column allows users to upload custom background images for their mint pages, providing:
- Custom hero section backgrounds
- Enhanced visual appeal
- Better branding for NFT collections

If you don't need hero images, you can continue using mint pages without this feature, but it's recommended to add the column for full functionality.

## Need Help?

If you're still encountering issues:
1. Check that your Supabase project has the correct permissions
2. Verify you're connected to the right database
3. Look for any console error messages when the API starts
4. Make sure your environment variables are correctly set

The API will automatically detect if the column exists and handle it appropriately. 