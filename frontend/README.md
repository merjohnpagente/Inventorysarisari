# SariStore Frontend (React + Vite)

## Run
```
npm install
cp .env.example .env     # set VITE_API_URL to your Laravel API
npm run dev
```

## API contract the Laravel backend must follow
- POST /login, /register -> `{ token, user }`; GET /user -> user; POST /logout
- GET /products?search&category_id&sort&dir&page&per_page -> Laravel paginator, each product with `category`
- POST /products and POST /products/{id} (with `_method=PUT`, multipart/form-data, field `product_image`); DELETE /products/{id}
- GET /categories -> array with `products_count`; DELETE /categories/{id}?reassign_to={id} (required when products exist)
- GET /stock-movements?movement_type&page -> paginator, each with `product`, `user`
- POST /stock-in, /stock-out `{ product_id, quantity, movement_date, remarks }`
- GET /dashboard -> `{ total_products, total_categories, total_stock, low_stock_count, stock_overview:[{name,quantity}], recent_products, low_stock, recently_updated }`
- GET /reports/inventory?type=total|current|out, /reports/low-stock, /reports/stock-movements (all accept search, category_id, from, to) -> array or paginator
- GET/PUT /settings `{ store_name, store_description }`
- PUT /profile `{ name, email }`, PUT /password `{ current_password, password, password_confirmation }`
  (these three extras and /register are not in your route list; add them in the backend step)
- Product images are served from `{API origin}/storage/{product_image}` (run `php artisan storage:link`)

## Preview mode (no backend)
`npm run dev:preview` runs the UI with an in-memory mock API and sample data (any email + 8+ char password logs in).
`npm run build:preview` builds a single-file `dist-preview/index.html`.
