<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Authentification",
 *     description="Endpoints d'authentification (login / logout / profil)"
 * )
 *
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="surname", type="string"),
 *     @OA\Property(property="username", type="string"),
 *     @OA\Property(property="email", type="string", format="email"),
 *     @OA\Property(property="phone", type="string"),
 *     @OA\Property(property="role", type="string"),
 *     @OA\Property(property="is_active", type="boolean")
 * )
 *
 * @OA\Schema(
 *     schema="AuthLoginRequest",
 *     type="object",
 *     required={"username","password"},
 *     @OA\Property(property="username", type="string", description="Email ou nom d'utilisateur"),
 *     @OA\Property(property="password", type="string", format="password")
 * )
 *
 * @OA\Schema(
 *     schema="AuthLoginResponse",
 *     type="object",
 *     @OA\Property(property="status", type="integer", example=200),
 *     @OA\Property(
 *         property="data",
 *         type="object",
 *         @OA\Property(property="user", ref="#/components/schemas/User"),
 *         @OA\Property(property="token", type="string")
 *     ),
 *     @OA\Property(property="message", type="array", @OA\Items(type="string"))
 * )
 */
class AuthController extends Controller
{
    public function login(Request $request)
    {
        /**
         * @OA\Post(
         *     path="/api/auth/login",
         *     tags={"Authentification"},
         *     summary="Authentifier un utilisateur et récupérer un token API (Sanctum)",
         *     @OA\RequestBody(
         *         required=true,
         *         @OA\JsonContent(ref="#/components/schemas/AuthLoginRequest")
         *     ),
         *     @OA\Response(
         *         response=200,
         *         description="Connexion réussie ou informations invalides",
         *         @OA\JsonContent(ref="#/components/schemas/AuthLoginResponse")
         *     )
         * )
         */
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
        
        $token = $user->createToken('auth-token')->plainTextToken;

        Log::info(message: $token);

        // Charger les rôles et permissions
        $user->load('roles.permissions');

        return response()->json([
            'status' => 200,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'surname' => $user->surname,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'is_active' => $user->is_active,
                    'roles' => $user->roles->pluck('name'),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ],
                'token' => $token,
            ],
            'message' => ['Connexion réussie'],

        ]);
    }

    public function logout(Request $request)
    {
        /**
         * @OA\Post(
         *     path="/api/auth/logout",
         *     tags={"Authentification"},
         *     summary="Révoquer le token d'accès courant",
         *     security={{"bearerAuth": {}}},
         *     @OA\Response(
         *         response=200,
         *         description="Déconnexion réussie"
         *     ),
         *     @OA\Response(
         *         response=401,
         *         description="Non authentifié"
         *     )
         * )
         */
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function me(Request $request)
    {
        /**
         * @OA\Get(
         *     path="/api/auth/me",
         *     tags={"Authentification"},
         *     summary="Récupérer le profil de l'utilisateur connecté",
         *     security={{"bearerAuth": {}}},
         *     @OA\Response(
         *         response=200,
         *         description="Utilisateur connecté",
         *         @OA\JsonContent(ref="#/components/schemas/User")
         *     ),
         *     @OA\Response(
         *         response=401,
         *         description="Non authentifié"
         *     )
         * )
         */
        $user = $request->user();
        $user->load('roles.permissions');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'surname' => $user->surname,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }
}
