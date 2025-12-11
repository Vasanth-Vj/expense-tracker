# Expense Reports – MERN

Production-ready MERN stack app for logging trips, persisting locations/clients, grouping expenses by date, and exporting Excel reports.

## Stack
- Backend: Node.js + Express + MongoDB (Mongoose), ExcelJS
- Frontend: React (Vite), Axios

## Local setup
```bash
# backend
cd backend
cp env.example .env   # adjust MONGO_URI/PORT
npm install
npm run dev

# frontend (new terminal)
cd frontend
cp env.example .env   # set VITE_API_BASE to your backend URL
npm install
npm run dev
```
Open http://localhost:5173. Default API base is http://localhost:4000/api.

## API overview
- `GET /api/health` – readiness probe
- `GET /api/options` – locations + clients (for dropdowns)
- `POST /api/expenses` – create expense. Body:
  ```json
  {
    "date": "2025-01-05",
    "fromLocation": "Chennai",
    "toLocation": "Bangalore",
    "clientName": "ACME",
    "kilometers": 320,
    "rupees": 3      // optional, defaults to 3
  }
  ```
  - Auto-saves new locations/clients for future dropdowns.
  - `total` is computed server-side.
- `GET /api/expenses` – list (optional `startDate`/`endDate`)
- `GET /api/expenses/export` – Excel grouped by date (same optional filters)

## Excel grouping
- Each date is placed in its own column; all entries for that date appear within that column so multiple same-day entries stay together.

## Deployment (free-tier friendly)
- Backend: Render Free Web Service or Railway free tier.
  - Create new service from GitHub repo.
  - Environment: `PORT=10000` (Render auto), `MONGO_URI=<your MongoDB Atlas URI>`.
  - Build: `cd backend && npm install`
  - Start: `cd backend && npm start`
- Database: MongoDB Atlas free shared cluster. Allow the hosting IPs; set the connection string in `MONGO_URI`.
- Frontend: Netlify or Vercel static site.
  - Build command: `cd frontend && npm install && npm run build`
  - Publish directory: `frontend/dist`
  - Environment: `VITE_API_BASE=<your deployed backend URL>/api`

## Notes
- Rupees default to 3; total is always recalculated on the server to ensure consistency.
- New locations/clients are persisted on first use and immediately available in dropdown suggestions.
- Basic server logging via morgan; CORS enabled by default.

