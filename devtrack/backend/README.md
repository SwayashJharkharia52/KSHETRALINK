# Geocode Setu Backend

REST API for the Geocode Setu frontend: datasets, CSV import, place records, explainable match suggestions, review decisions, dashboard statistics, CSV export, and provenance/audit logs.

> This is a working starter backend, not a production-certified geospatial system. Its matching score is a transparent heuristic (not a calibrated probability). Cross-script transliteration, polygon topology checks, authentication, authorization, rate limiting, and production deployment hardening are not included yet.

## Requirements
- Node.js 20+
- PostgreSQL 14+ (or compatible)

## Setup (Windows PowerShell)
1. Extract this folder separately, or place it beside your frontend project.
2. Create a PostgreSQL database named `geocode_setu`.
3. Copy `.env.example` to `.env` and update `DATABASE_URL` with your PostgreSQL username/password.
4. Install dependencies:
   ```powershell
   npm install
   ```
5. Create tables by running `sql/schema.sql` in the `geocode_setu` database. For example, if `psql` is installed:
   ```powershell
   psql -U postgres -d geocode_setu -f sql/schema.sql
   ```
6. Start the API:
   ```powershell
   npm start
   ```
7. Test `http://localhost:4000/api/health`. It should return `{ "ok": true, ... }`.

## Configure frontend
Set the frontend's API base URL to `http://localhost:4000/api`. Add this header when a reviewer identity is available: `x-actor: Reviewer Name`. The current backend uses this as an audit label only; it is **not authentication**.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API and database health |
| GET | `/api/dashboard` | Summary counts |
| GET/POST | `/api/datasets` | List/create datasets |
| POST | `/api/datasets/:id/upload-csv` | Import CSV using multipart field `file` |
| GET | `/api/places?q=...&district=...` | Search/filter places |
| GET | `/api/places/:id` | Place and provenance details |
| POST | `/api/matching/suggest` | Score candidates for a source place |
| POST | `/api/matches` | Save/update a suggested pair |
| GET | `/api/matches?status=needs_review` | List matches |
| PATCH | `/api/matches/:id/review` | Approve/reject/return for review |
| GET | `/api/provenance?entity_type=match` | Audit history |
| GET | `/api/export/matches.csv` | Download matches CSV |

### Create a dataset
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/datasets -ContentType 'application/json' -Body '{"name":"Soil Survey Demo","dataset_type":"soil","source_organization":"Demo data"}'
```
Save the returned `id` as `$datasetId`, then import CSV:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/datasets/$datasetId/upload-csv" -Form @{ file = Get-Item .\examples\villages-soil.csv }
```
Repeat for the weather CSV with a second dataset. Use `GET /api/places` to find place UUIDs, then call `POST /api/matching/suggest` with `source_place_id` and `target_dataset_id`.

### Review a match
```json
{
  "decision": "approve",
  "reviewer": "Reviewer 1",
  "note": "Name, district and coordinates reviewed against the supplied demo data."
}
```
Send it to `PATCH /api/matches/{matchId}/review`. Allowed decisions: `approve`, `reject`, `needs_review`.

## CSV columns
A `name`, `village`, `village_name`, `original_name`, `location_name`, or `place_name` column is required. Optional recognized columns include `external_id`, `location_id`, `village_id`, `state`, `district`, `plot_id`, `latitude`/`lat`, `longitude`/`lon`/`lng`, `language`, plus arbitrary extra columns retained in `attributes`.

## Matching behaviour
The baseline score combines normalized name equality/similarity, state/district agreement, identical external IDs, and coordinate proximity. Scores are capped at 100 and include a list of evidence factors. A score is not a probability of correctness. Names written in different scripts (for example, `गोरखपुर` and `Gorakhpur`) are **not automatically transliterated**; add a transliteration/alias dictionary or a language-aware library before relying on cross-script matches.

## Important security notes before deployment
- Add authentication and role-based authorization before exposing review/write routes publicly.
- Use HTTPS and a managed database with backups; never commit `.env` credentials.
- Configure production CORS to your exact frontend domain.
- Add request rate limits, monitoring, retention rules, and proper reviewer identity verification.
- Validate source datasets and GIS geometry before using matches for real-world agricultural decisions.
