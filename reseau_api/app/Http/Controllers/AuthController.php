<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
 *
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
 *
 *     @OA\Property(property="username", type="string", description="Email ou nom d'utilisateur"),
 *     @OA\Property(property="password", type="string", format="password")
 * )
 *
 * @OA\Schema(
 *     schema="AuthLoginResponse",
 *     type="object",
 *
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
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    /**
     * @OA\Post(
     *     path="/api/auth/login",
     *     tags={"Authentification"},
     *     summary="Authentifier un utilisateur et récupérer un token API (Sanctum)",
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/AuthLoginRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Connexion réussie ou informations invalides",
     *
     *         @OA\JsonContent(ref="#/components/schemas/AuthLoginResponse")
     *     )
     * )
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->username, $request->password);

        return $this->successResponse($result['data'], $result['message']);
    }

    /**
     * @OA\Post(
     *     path="/api/auth/logout",
     *     tags={"Authentification"},
     *     summary="Révoquer le token d'accès courant",
     *     security={{"bearerAuth": {}}},
     *
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
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->successResponse(message: 'Déconnexion réussie');
    }

    /**
     * @OA\Get(
     *     path="/api/auth/me",
     *     tags={"Authentification"},
     *     summary="Récupérer le profil de l'utilisateur connecté",
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Utilisateur connecté",
     *
     *         @OA\JsonContent(ref="#/components/schemas/User")
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Non authentifié"
     *     )
     * )
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse($this->authService->getProfile($request->user()));
    }
}
