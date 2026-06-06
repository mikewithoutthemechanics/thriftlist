# Contributing

## Setup

```bash
npm ci
npm run dev
```

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run test
```

## Notes

- Do not add secrets or Supabase keys to the repository.
- Prefer server-side Supabase clients for privileged operations.
