<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $low = fn () => Product::where('quantity', '>', 0)->whereColumn('quantity', '<=', 'minimum_stock');

        return response()->json([
            'total_products' => Product::count(),
            'total_categories' => Category::count(),
            'total_stock' => (int) Product::sum('quantity'),
            'low_stock_count' => $low()->count(),
            'stock_overview' => Product::orderByDesc('quantity')->limit(8)->get()
                ->map(fn ($p) => ['name' => Str::limit($p->product_name, 12, ''), 'quantity' => $p->quantity])->values(),
            'recent_products' => Product::with('category')->latest()->limit(5)->get(),
            'low_stock' => $low()->with('category')->orderBy('quantity')->limit(10)->get(),
            'recently_updated' => Product::with('category')->orderByDesc('updated_at')->limit(5)->get(),
        ]);
    }
}
