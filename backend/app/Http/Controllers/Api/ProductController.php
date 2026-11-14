<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    private const SORTABLE = ['id', 'product_name', 'selling_price', 'purchase_price', 'quantity', 'created_at', 'updated_at'];

    public function index(Request $request)
    {
        $sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at';
        $dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        $perPage = max(1, min((int) $request->query('per_page', 10), 500));

        return Product::with('category')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->query('search').'%';
                $q->where(fn ($w) => $w->where('product_name', 'like', $term)->orWhere('description', 'like', $term));
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->query('category_id')))
            ->orderBy($sort, $dir)
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $product = DB::transaction(function () use ($request, $data) {
            if ($request->hasFile('product_image')) {
                $data['product_image'] = $request->file('product_image')->store('products', 'public');
            }
            $product = Product::create($data);

            if ($product->quantity > 0) {
                $this->record($product, 'IN', $product->quantity, 'Initial stock');
            }

            return $product;
        });

        return response()->json($product->load('category'), 201);
    }

    public function show(Product $product)
    {
        return $product->load('category');
    }

    public function update(Request $request, Product $product)
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($request, $data, $product) {
            $oldQuantity = $product->quantity;

            if ($request->hasFile('product_image')) {
                if ($product->product_image) {
                    Storage::disk('public')->delete($product->product_image);
                }
                $data['product_image'] = $request->file('product_image')->store('products', 'public');
            }
            $product->update($data);

            // Keep the movement history accurate when quantity is edited directly.
            $diff = $product->quantity - $oldQuantity;
            if ($diff !== 0) {
                $this->record($product, $diff > 0 ? 'IN' : 'OUT', abs($diff), 'Manual adjustment (product edit)');
            }
        });

        return $product->fresh('category');
    }

    public function destroy(Product $product)
    {
        if ($product->product_image) {
            Storage::disk('public')->delete($product->product_image);
        }
        $product->delete(); // stock movements are removed by the foreign key cascade

        return response()->json(['message' => 'Product deleted.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'product_name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'purchase_price' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'selling_price' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'quantity' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'product_image' => ['nullable', 'image', 'max:2048'],
        ]);
    }

    private function record(Product $product, string $type, int $qty, string $remarks): void
    {
        StockMovement::create([
            'product_id' => $product->id,
            'user_id' => auth()->id(),
            'movement_type' => $type,
            'quantity' => $qty,
            'remarks' => $remarks,
            'movement_date' => now()->toDateString(),
        ]);
    }
}
