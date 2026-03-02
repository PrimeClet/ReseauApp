<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $headers = $request->headers->all();

        if (isset($headers['authorization'])) {
            $headers['authorization'] = ['***MASKED***'];
        }
        if (isset($headers['cookie'])) {
            $headers['cookie'] = ['***MASKED***'];
        }

        \Log::info('API Request', [
            'correlation_id' => app()->bound('correlation_id') ? app('correlation_id') : null,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_id' => $request->user()?->id,
            'headers' => $headers,
        ]);

        return $next($request);
    }
}
