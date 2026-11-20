<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $categories) {}

    public function index()
    {
        return response()->json(['data' => $this->categories->list()]);
    }
}
