# Supabase backend structure

This folder contains the backend scaffolding for Glowworks Lab.

## Files
- client.ts: Supabase client initialization
- schema.sql: full database schema with relationships and RLS setup
- seed.sql: initial sample data for services, gallery, discounts and admin users
- service.ts: typed helper methods for common queries and inserts
- types.ts: TypeScript interfaces mapped to Supabase tables

## How to use it
1. Create a Supabase project.
2. Set these environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. Run the SQL in schema.sql in the Supabase SQL editor.
4. Optionally run seed.sql to populate sample data.
5. Call the helpers from service.ts from future portal/admin features.

## Relationship model
- customers -> vehicles (one-to-many)
- vehicles -> installations (one-to-many)
- installations -> warranties (one-to-one)
- appointments reference customers, vehicles and services
- admins are separate from customers for internal operations
