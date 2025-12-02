<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;

/**
 * Définition racine du document OpenAPI pour l5-swagger.
 *
 * @OA\OpenApi(
 *     @OA\Info(
 *         version="1.0.0",
 *         title="Reseau Inventaire App API",
 *         description="API d'inventaire et de cartographie réseau (Laravel 11 + Sanctum)."
 *     ),
 *     @OA\Server(
 *         url="/",
 *         description="Serveur principal"
 *     ),
 *     @OA\SecurityScheme(
 *         securityScheme="bearerAuth",
 *         type="http",
 *         scheme="bearer",
 *         bearerFormat="JWT",
 *         description="Token d'accès généré par Sanctum (Authorization: Bearer {token})"
 *     )
 * )
 */
class ApiDocController extends Controller
{
    // Ce contrôleur ne contient pas de logique métier.
    // Il sert uniquement de support aux annotations OpenAPI globales.
}


