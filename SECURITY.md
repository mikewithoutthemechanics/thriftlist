# Security

## Secrets

- Never commit `.env` files or database artifacts.
- Production requires `SUPABASE_SERVICE_ROLE_KEY` and `ENCRYPTION_KEY`.
- Rotate credentials immediately if they are ever exposed.

## Migrations Endpoint

- `/api/run-migrations` is protected by `MIGRATIONS_API_SECRET`.
- Do not expose the secret to browsers or client-side code.

## Data Storage

- Supabase Storage bucket access should match your privacy requirements.
- Prefer private buckets and signed URLs for user-private media.
