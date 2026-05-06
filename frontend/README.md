# Frontend

This frontend is a Next.js application for the Property Management System.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API configuration

Create one of the local env files supported by Next.js if you need to override the backend URL.

Example:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

## Notes

- The UI currently focuses on property operations, admin access, and live API-driven master data.
- Local development assumes the backend runs on `http://localhost:8080`.
