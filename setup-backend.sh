#!/usr/bin/env bash
# SariStore backend setup (macOS/Linux). Needs PHP 8.2+ and Composer.
set -e
if [ -f backend/artisan ]; then echo "Backend is already set up. Skip to: cd backend && php artisan migrate --seed"; exit 0; fi
echo "[1/4] Creating a fresh Laravel project (takes a few minutes)..."
composer create-project laravel/laravel _fresh --no-interaction
echo "[2/4] Adding SariStore files..."
cp -a backend/. _fresh/
rm -rf backend && mv _fresh backend
cd backend
echo "[3/4] Configuring MySQL + Sanctum..."
cp .env.example .env
php artisan key:generate
php artisan install:api --without-migration-prompt --no-interaction
php artisan storage:link
echo "[4/4] Done!"
echo
echo 'Next: create an empty MySQL database named "saristore", then run:'
echo "  cd backend && php artisan migrate --seed && php artisan serve"
