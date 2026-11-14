@echo off
rem SariStore backend setup (Windows). Needs PHP 8.2+ and Composer in your PATH.
if exist backend\artisan (
  echo Backend is already set up. Skip to: cd backend ^& php artisan migrate --seed
  exit /b 0
)
echo [1/4] Creating a fresh Laravel project (takes a few minutes)...
call composer create-project laravel/laravel _fresh --no-interaction || exit /b 1
echo [2/4] Adding SariStore files...
xcopy backend _fresh /E /Y /I >nul
rmdir /S /Q backend
ren _fresh backend
cd backend
echo [3/4] Configuring MySQL + Sanctum...
copy /Y .env.example .env >nul
call php artisan key:generate
call php artisan install:api --without-migration-prompt --no-interaction
call php artisan storage:link
echo [4/4] Done!
echo.
echo Next: create an empty MySQL database named "saristore" (phpMyAdmin), then run:
echo   cd backend
echo   php artisan migrate --seed
echo   php artisan serve
