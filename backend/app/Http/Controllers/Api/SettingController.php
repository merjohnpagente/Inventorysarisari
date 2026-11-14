<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show()
    {
        return $this->current();
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'store_description' => ['nullable', 'string', 'max:1000'],
        ]);

        $setting = $this->current();
        $setting->update($data);

        return $setting;
    }

    private function current(): StoreSetting
    {
        return StoreSetting::firstOrCreate(['id' => 1], ['store_name' => 'My Sari-Sari Store']);
    }
}
