<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        Log::info($request);
        $identifier = $request->username;
        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL); // Vérifie si c'est un email


        $user = User::where(function ($query) use ($identifier, $isEmail) {
                        if ($isEmail) {
                            $query->where('email', $identifier); // Si c'est un email
                        } else {
                            $query->where('username', $identifier); // Sinon, c'est un username
                        }
                    })
                   ->where('is_active', true)
                   ->first();

        Log::info(message: $user);

        
        if (!$user || !Hash::check($request->password, $user->password)) {
            Log::info('dedans');
            
            // throw ValidationException::withMessages([
            //     'username' => ['Les informations d\'identification fournies sont incorrectes.'],
            // ]);

            return response()->json([
                'status' => 200,
                'data' => [],
                'message' => ['Les informations d\'identification fournies sont incorrectes.'],
            ]);
            
        }
        
        if(!$user) {
            throw ValidationException::withMessages([
                'username' => ['Les informations d\'identification fournies sont incorrectes.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        Log::info(message: $token);


        // AuditLog::log('User Login', $user);

        return response()->json([
            'status' => 200,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
            'message' => ['Connexion réussie'],
            
        ]);
    }

    public function logout(Request $request)
    {
        // AuditLog::log('User Logout', $request->user());
        
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
