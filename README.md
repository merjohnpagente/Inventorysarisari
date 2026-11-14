# SariStore (Inventorysarisari)

Sari-sari store inventory management system.

- `frontend/` — React + Vite + Tailwind UI (live preview with sample data: https://merjohnpagente.github.io/Inventorysarisari/)
- `backend/` — Laravel API + MySQL (see `backend/README.md`)
- `setup-backend.bat` / `setup-backend.sh` — builds the full Laravel app from the files in `backend/`

Quick start: run the setup script, create the `saristore` database, `php artisan migrate --seed`, `php artisan serve`, then `npm run dev` in `frontend/`. Login: `admin` / `Admin@12345`.
