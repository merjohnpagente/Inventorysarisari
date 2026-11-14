<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Initial administrator (login with "admin" or the email)
        $admin = User::firstOrCreate(
            ['email' => 'admin@saristore.test'],
            ['name' => 'admin', 'password' => 'Admin@12345']
        );

        StoreSetting::firstOrCreate(
            ['id' => 1],
            ['store_name' => 'My Sari-Sari Store', 'store_description' => 'Your friendly neighborhood store.']
        );

        $categories = [
            'Snacks', 'Beverages', 'Canned Goods', 'Noodles',
            'Biscuits', 'Personal Care', 'Household Products', 'Other',
        ];
        foreach ($categories as $name) {
            Category::firstOrCreate(['category_name' => $name]);
        }

        // [name, category, selling price, quantity, minimum stock]
        $products = [
            ['Piattos', 'Snacks', 20, 25, 15],
            ['Coca-Cola', 'Beverages', 20, 30, 10],
            ['Lucky Me Pancit Canton', 'Noodles', 15, 40, 15],
            ['Sardines', 'Canned Goods', 25, 20, 20],
            ['SkyFlakes', 'Biscuits', 10, 35, 10],
            ['Milo Sachet', 'Beverages', 12, 15, 20],
            ['Kopiko', 'Snacks', 2, 100, 30],
            ['Palmolive Soap', 'Personal Care', 25, 12, 15],
        ];

        foreach ($products as [$name, $category, $price, $qty, $min]) {
            $product = Product::firstOrCreate(
                ['product_name' => $name],
                [
                    'category_id' => Category::where('category_name', $category)->value('id'),
                    'description' => null,
                    'purchase_price' => round($price * 0.8, 2),
                    'selling_price' => $price,
                    'quantity' => $qty,
                    'minimum_stock' => $min,
                ]
            );

            if ($product->wasRecentlyCreated) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $admin->id,
                    'movement_type' => 'IN',
                    'quantity' => $qty,
                    'remarks' => 'Initial stock',
                    'movement_date' => now()->toDateString(),
                ]);
            }
        }
    }
}
