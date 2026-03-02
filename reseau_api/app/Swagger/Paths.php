<?php

use OpenApi\Annotations as OA;

/**
 * Fichier d'annotations OpenAPI dédié aux chemins (PathItem).
 * Il permet de satisfaire l'exigence de swagger-php qui réclame
 * au moins un @OA\PathItem défini explicitement.
 */

/**
 * @OA\PathItem(
 *     path="/api/auth/login",
 *
 *     @OA\Post(
 *         operationId="loginUser",
 *         tags={"Authentification"},
 *         summary="Authentifier un utilisateur et récupérer un token API (Sanctum)",
 *
 *         @OA\RequestBody(
 *             required=true,
 *
 *             @OA\JsonContent(ref="#/components/schemas/AuthLoginRequest")
 *         ),
 *
 *         @OA\Response(
 *             response=200,
 *             description="Connexion réussie ou informations invalides",
 *
 *             @OA\JsonContent(ref="#/components/schemas/AuthLoginResponse")
 *         )
 *     )
 * )
 */
