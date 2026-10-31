<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['message' => 'Lyceum Club API']));
Route::get('/health', fn () => response()->json(['status' => 'ok']));
