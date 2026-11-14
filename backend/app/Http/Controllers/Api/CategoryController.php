<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::withCount('products')->orderBy('category_name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_name' => ['required', 'string', 'max:255', 'unique:categories,category_name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        return response()->json(Category::create($data), 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'category_name' => ['required', 'string', 'max:255', Rule::unique('categories', 'category_name')->ignore($category->id)],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);
        $category->update($data);

        return $category;
    }

    public function destroy(Request $request, Category $category)
    {
        $count = $category->products()->count();

        if ($count > 0) {
            $request->validate([
                'reassign_to' => ['required', 'exists:categories,id', Rule::notIn([$category->id])],
            ], [
                'reassign_to.required' => "This category still has {$count} product(s). Choose another category to move them to.",
            ]);

            DB::transaction(function () use ($request, $category) {
                Product::where('category_id', $category->id)->update(['category_id' => $request->input('reassign_to')]);
                $category->delete();
            });
        } else {
            $category->delete();
        }

        return response()->json(['message' => 'Category deleted.']);
    }
}
