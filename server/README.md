## Workforce tracking backend

Endpoints
- POST /auth/register, /auth/login
- POST /clock/clock-in, /clock/clock-out
- POST /ingest/locations, /ingest/phone-usage
- GET/POST/PUT/DELETE /admin/geofences
- GET /user/trips
- GET /health

Run locally
```bash
npm i
npx prisma migrate dev
npm run dev
```

Env
- DATABASE_URL=file:./dev.db
- JWT_SECRET=change-me

