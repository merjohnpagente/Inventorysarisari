# Deploy SariStore on InfinityFree (free hosting)

> **Untested.** This guide was written from InfinityFree's own forum guidance, not from a live deployment. Follow it step by step and report any step that fails.

## What to know first

- InfinityFree has **no SSH and no artisan**, so everything that needs a command runs on your PC and the results are uploaded.
- Its browser check blocks API calls from **other domains** and from non-browser clients. So the frontend and the API must live on the **same domain**. That is why this setup serves both from one site and the frontend calls `/api` (a relative path).
- There is no cron, no queue worker, and no symlinks. SariStore does not need cron or queues. `storage:link` is replaced by a rewrite rule in `htaccess.txt`.
- PHP files over **1 MB are silently dropped** on upload. Do not use `composer install --optimize-autoloader`.
- Free hosting can suspend a site on traffic spikes. Back up the database regularly.

## 1. Prepare the backend on your PC

1. Run `setup-backend.bat` (or `./setup-backend.sh`) once, as in the main README.
2. Create a local database named `saristore`, then in `backend/`:
   ```
   php artisan migrate --seed
   php artisan key:generate --show
   ```
   Keep the printed `base64:...` value. It is your `APP_KEY`.
3. Remove dev packages (still no `--optimize-autoloader`):
   ```
   composer install --no-dev
   ```
4. Check that no PHP file is over 1 MB:
   - Mac/Linux: `find vendor -name "*.php" -size +1M`
   - PowerShell: `Get-ChildItem vendor -Recurse -Filter *.php | Where-Object Length -gt 1MB`
   
   If something is listed, upload it another way (zip it, upload the zip, and unzip with InfinityFree's File Manager).
5. Export the database: in phpMyAdmin pick `saristore` > Export > Quick > SQL. If you logged in locally, empty the `personal_access_tokens` table first.

## 2. Build the frontend

The API address is baked in at build time. Use the relative path `/api`:

```
cd frontend
npm install
```
then one of:
- Mac/Linux: `VITE_API_URL=/api npm run build`
- Windows cmd: `set VITE_API_URL=/api && npm run build`
- PowerShell: `$env:VITE_API_URL="/api"; npm run build`

The result is in `frontend/dist/`.

## 3. Set up InfinityFree

1. Create the hosting account and a free subdomain.
2. Turn on the free SSL certificate in the control panel (do this before first use, so browsers do not warn).
3. Under **MySQL Databases**, create a database. Note the **host**, **database name**, **username** and **password**.
4. Open phpMyAdmin from there and **import** the SQL file from step 1.5.

## 4. Upload to `htdocs/`

Final layout:

```
htdocs/
  .htaccess          <- htaccess.txt from this folder, renamed
  .env               <- from env.example.txt, filled in
  app/ bootstrap/ config/ database/ routes/ storage/ vendor/ artisan composer.json ...   (contents of backend/)
  public/            (Laravel's public/ files: index.php, .htaccess, ...)
    app.html         <- frontend/dist/index.html, renamed
    assets/          <- frontend/dist/assets/
```

Notes:
- Upload the **contents** of `backend/`, not the folder itself. Do not upload your local `.env`, `node_modules`, or `tests/`.
- Copy `frontend/dist/*` into `htdocs/public/`, and rename `index.html` to `app.html`. Do not leave an `index.html` next to Laravel's `index.php`.
- These folders must exist (create them if your FTP client skipped empty ones): `bootstrap/cache`, `storage/app/public`, `storage/framework/cache/data`, `storage/framework/sessions`, `storage/framework/views`, `storage/logs`.
- Do not run or upload `config:cache` output from your PC. It stores your local paths.

## 5. Test

1. Open your site. You should see the login page.
2. Log in with `admin` / `Admin@12345`, then **change the password immediately** in Settings.
3. Add a product with an image, do a stock in and stock out, and open Reports.
4. Try it on a phone too.

## Troubleshooting

| Symptom | Try |
| --- | --- |
| Blank page or 500 | Set `APP_DEBUG=true` for a minute to read the error (then set it back), or read `storage/logs/laravel.log`. |
| Errors that do not match your code | Delete the files inside `bootstrap/cache/` and `storage/framework/views/` (keep the folders). |
| Login page loads but every request fails | Open `https://yoursite/api/user` in a browser. A JSON "Unauthenticated" reply, or a Laravel error page saying `Route [login] not defined`, both mean Laravel is reachable (a browser sends no JSON header, so the error page is normal). A "requires JavaScript" page means the request came from another domain or a non-browser client. |
| Product images do not show | Check rule 2 in `.htaccess` and that files exist in `storage/app/public/products/`. |
| 500 right after upload | A PHP file over 1 MB may have been dropped. Re-check step 1.4. |
| Pages 404 on refresh | `.htaccess` is missing or not named exactly `.htaccess`. |

## Sources

- [InfinityFree forum: How to install a Laravel site on InfinityFree](https://forum.infinityfree.com/t/how-to-install-a-laravel-site-on-infinityfree/118578)
- [InfinityFree forum: Browser Security System, features and limitations](https://forum.infinityfree.com/t/browser-security-system-features-and-limitations/49353)
