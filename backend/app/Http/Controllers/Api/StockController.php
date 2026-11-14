<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockController extends Controller
{
    public function index(Request $request)
    {
        return StockMovement::with(['product:id,product_name,category_id', 'user:id,name'])
            ->when(in_array($request->query('movement_type'), ['IN', 'OUT'], true), fn ($q) => $q->where('movement_type', $request->query('movement_type')))
            ->orderByDesc('movement_date')
            ->orderByDesc('id')
            ->paginate(15);
    }

    public function stockIn(Request $request)
    {
        return $this->move($request, 'IN');
    }

    public function stockOut(Request $request)
    {
        return $this->move($request, 'OUT');
    }

    private function move(Request $request, string $type)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'movement_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $movement = DB::transaction(function () use ($data, $type) {
            // Lock the row so two requests cannot both take the last items.
            $product = Product::whereKey($data['product_id'])->lockForUpdate()->firstOrFail();

            if ($type === 'OUT' && $data['quantity'] > $product->quantity) {
                throw ValidationException::withMessages(['quantity' => ["Only {$product->quantity} in stock."]]);
            }

            $product->quantity += $type === 'IN' ? $data['quantity'] : -$data['quantity'];
            $product->save();

            return StockMovement::create([
                'product_id' => $product->id,
                'user_id' => auth()->id(),
                'movement_type' => $type,
                'quantity' => $data['quantity'],
                'remarks' => $data['remarks'] ?? null,
                'movement_date' => $data['movement_date'],
            ]);
        });

        return response()->json([
            'message' => $type === 'IN' ? 'Stock added.' : 'Stock removed.',
            'movement' => $movement->load('product:id,product_name,quantity'),
        ], 201);
    }
}
