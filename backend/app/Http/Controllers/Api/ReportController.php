<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /** type = total (default) | current (in stock) | out (out of stock) */
    public function inventory(Request $request)
    {
        $query = $this->products($request);

        match ($request->query('type')) {
            'current' => $query->where('quantity', '>', 0),
            'out' => $query->where('quantity', '<=', 0),
            default => null,
        };

        return $query->orderBy('product_name')->get();
    }

    public function lowStock(Request $request)
    {
        return $this->products($request)
            ->where('quantity', '>', 0)
            ->whereColumn('quantity', '<=', 'minimum_stock')
            ->orderBy('quantity')
            ->get();
    }

    public function stockMovements(Request $request)
    {
        $search = $request->query('search');

        return StockMovement::with(['product.category', 'user:id,name'])
            ->when(in_array($request->query('movement_type'), ['IN', 'OUT'], true), fn ($q) => $q->where('movement_type', $request->query('movement_type')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('movement_date', '>=', $request->query('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('movement_date', '<=', $request->query('to')))
            ->when($search, fn ($q) => $q->whereHas('product', fn ($p) => $p->where('product_name', 'like', "%{$search}%")))
            ->when($request->filled('category_id'), fn ($q) => $q->whereHas('product', fn ($p) => $p->where('category_id', $request->query('category_id'))))
            ->orderByDesc('movement_date')
            ->orderByDesc('id')
            ->get();
    }

    private function products(Request $request)
    {
        return Product::with('category')
            ->when($request->filled('search'), fn ($q) => $q->where('product_name', 'like', '%'.$request->query('search').'%'))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->query('category_id')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->query('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->query('to')));
    }
}
