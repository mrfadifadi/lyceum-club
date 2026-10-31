<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('currentUser');
        if (!$user instanceof User || $user->role !== 'admin') {
            return response()->json(['detail' => 'Administrator access is required'], 403);
        }

        return $next($request);
    }
}
