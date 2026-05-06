# Property Management System

This repository contains a full-stack property management system with:

- `frontend/`: Next.js 16 + TypeScript + Tailwind CSS 4 + Zustand + React Hook Form + Zod + Recharts
- `backend/`: Spring Boot 3.3 + Spring Security + Spring Data JPA + Flyway + OpenAPI

## What is implemented

- enterprise-style frontend shell with dashboard, companies, branches, properties, units, tenants, vendors, owners, users, roles, and login
- reusable frontend components for layout, cards, tables, charts, and forms
- backend modules for authentication, companies, branches, properties, units, tenants, vendors, owners, roles, and users
- Flyway baseline schema for property management master data and access control
- local MySQL runtime configuration with Flyway-managed schema migrations

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local MySQL setup

Default local runtime values:

- database: `propertymanagement`
- host: `localhost:3306`
- username: `root` unless `DB_USERNAME` is set
- password: empty unless `DB_PASSWORD` is set

If you want a dedicated local app user, run:

```bash
mysql -u root -p < backend/scripts/mysql/init.sql
```

That script creates:

- database: `propertymanagement`
- user: `pms_user`
- password: `pms_password`

## Backend environment file

Create `backend/.env.properties` with the values you want to run locally, for example:

```properties
DB_URL=jdbc:mysql://localhost:3306/propertymanagement?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata
DB_USERNAME=pms_user
DB_PASSWORD=pms_password
JWT_SECRET=change-this-secret-before-sharing
MAIL_FROM=support@example.com
SPRING_MAIL_HOST=smtp.office365.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=support@example.com
SPRING_MAIL_PASSWORD=change-this-mail-password
```

The backend loads `backend/.env.properties` automatically.

## Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

Open `http://localhost:8080/swagger-ui.html` for the API docs.

## Default admin login

For a fresh database seeded from the Flyway migrations, the starter admin account is:

- email: `admin@pms.local`
- password: `Password1`

## Run with Docker

The repository includes Docker services for:

- `mysql` on `localhost:3307`
- `backend` on `http://localhost:8080`
- `frontend` on `http://localhost:3000`

Start everything:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up --build -d
```

Stop everything:

```bash
docker compose down
```

Stop and remove the database volume too:

```bash
docker compose down -v
```

Notes:

- The backend connects to MySQL through the Docker service name `mysql`.
- MySQL is published on `localhost:3307` to avoid conflicts with an existing local MySQL on `3306`.
- The frontend is built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api` so the browser can reach the backend from your host machine.
- Update `JWT_SECRET` in [compose.yaml](/Users/sibi/Workspaces/projects/projectmanagementsystem-new/compose.yaml) before sharing or deploying beyond local use.

## Suggested next steps

1. Replace mock frontend data with calls to the backend API client in `frontend/src/lib/api.ts`.
2. Add route protection and token refresh handling in the frontend shell.
3. Expand workflow, reporting, and validation rules for property operations and occupancy management.
