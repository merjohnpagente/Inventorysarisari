# SariStore Backend (Laravel API)

This folder holds the SariStore code (models, migrations, controllers, routes, seeders, `.env.example`).
The setup script downloads a fresh Laravel project and merges these files into it, so `backend/` becomes the full app.

## Requirements
PHP 8.2+, Composer, MySQL (XAMPP or Laragon works). Make sure `php` and `composer` work in your terminal.

## Setup
From the `sari-store` folder:

- Windows: `setup-backend.bat`
- macOS/Linux: `./setup-backend.sh`

Then create an **empty MySQL database named `saristore`** (phpMyAdmin → New), and run:

```
cd backend
php artisan migrate --seed
php artisan serve
```

The API runs at http://localhost:8000/api. If your MySQL has a password or a different name, edit `backend/.env`.

## Run with the frontend
```
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

## Default admin
- Username: `admin` (or `admin@saristore.test`)
- Password: `Admin@12345` — change it in Settings after your first login.

Sample data (8 products, 8 categories) is created by the seeder. New admins can only be registered by a logged-in admin; the public register endpoint works only while there are no users.

## Endpoints
Auth: `POST /login`, `POST /register`, `POST /logout`, `GET /user`, `PUT /profile`, `PUT /password`
Products: `GET|POST /products`, `GET|PUT|DELETE /products/{id}` (image uploads use `POST` with `_method=PUT`)
Categories: `GET|POST /categories`, `PUT|DELETE /categories/{id}` (delete needs `reassign_to` when it still has products)
Stock: `GET /stock-movements`, `POST /stock-in`, `POST /stock-out` (database transaction, never goes below 0)
Dashboard: `GET /dashboard`
Reports: `GET /reports/inventory?type=total|current|out`, `/reports/low-stock`, `/reports/stock-movements`
Settings: `GET|PUT /settings`
