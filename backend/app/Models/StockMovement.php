<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = ['product_id', 'user_id', 'movement_type', 'quantity', 'remarks', 'movement_date'];

    protected $casts = [
        'quantity' => 'integer',
        'movement_date' => 'date:Y-m-d',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
