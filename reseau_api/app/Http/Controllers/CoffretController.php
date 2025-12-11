<?php

namespace App\Http\Controllers;

use App\Models\Coffret;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Coffrets",
 *     description="Gestion des coffrets (armoires / baies réseau)"
 * )
 *
 * @OA\Schema(
 *     schema="Coffret",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="code", type="string"),
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="piece", type="string"),
 *     @OA\Property(property="long", type="number", format="float"),
 *     @OA\Property(property="lat", type="number", format="float"),
 *     @OA\Property(property="status", type="string", example="active"),
 * )
 */
class CoffretController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        /**
         * @OA\Get(
         *     path="/api/coffrets",
         *     tags={"Coffrets"},
         *     summary="Lister les coffrets",
         *     security={{"bearerAuth": {}}},
         *     @OA\Parameter(
         *         name="status",
         *         in="query",
         *         description="Filtrer par statut (active, inactive, maintenance)",
         *         required=false,
         *         @OA\Schema(type="string")
         *     ),
         *     @OA\Parameter(
         *         name="search",
         *         in="query",
         *         description="Recherche par nom",
         *         required=false,
         *         @OA\Schema(type="string")
         *     ),
         *     @OA\Response(
         *         response=200,
         *         description="Liste paginée de coffrets"
         *     ),
         *     @OA\Response(
         *         response=401,
         *         description="Non authentifié"
         *     ),
         *     @OA\Response(
         *         response=403,
         *         description="Non autorisé"
         *     )
         * )
         */
        $query = Coffret::with('equipements', 'metrics');

         // Filtrage par statut et recherche par nom

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $coffrets = $query->orderBy('nom')->paginate(15);

        return response()->json($coffrets);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        /**
         * @OA\Post(
         *     path="/api/coffrets",
         *     tags={"Coffrets"},
         *     summary="Créer un coffret",
         *     security={{"bearerAuth": {}}},
         *     @OA\RequestBody(
         *         required=true,
         *         @OA\JsonContent(
         *             required={"name","piece","long","lat"},
         *             @OA\Property(property="name", type="string"),
         *             @OA\Property(property="piece", type="string"),
         *             @OA\Property(property="long", type="number", format="float"),
         *             @OA\Property(property="lat", type="number", format="float"),
         *             @OA\Property(property="status", type="string", example="active")
         *         )
         *     ),
         *     @OA\Response(
         *         response=201,
         *         description="Coffret créé",
         *         @OA\JsonContent(ref="#/components/schemas/Coffret")
         *     ),
         *     @OA\Response(
         *         response=401,
         *         description="Non authentifié"
         *     ),
         *     @OA\Response(
         *         response=403,
         *         description="Non autorisé"
         *     ),
         *     @OA\Response(
         *         response=422,
         *         description="Erreur de validation"
         *     )
         * )
         */
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'piece' => 'required|string',
            'long' => 'required|numeric',
            'lat' => 'required|numeric',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        $coffret = Coffret::create([
            'name' => $request->name,
            'piece' => $request->piece,
            'long' => $request->long,
            'lat' => $request->lat,
            'status' => $request->status ?? 'active', // Valeur par défaut si non fournie
        ]);
    
        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret créé avec succès.',
            'coffret' => $coffret,
        ], 201);

    }

    /**
     * Display the specified resource.
     */
    public function show(Coffret $coffret)
    {
        /**
         * @OA\Get(
         *     path="/api/coffrets/{id}",
         *     tags={"Coffrets"},
         *     summary="Afficher un coffret",
         *     security={{"bearerAuth": {}}},
         *     @OA\Parameter(
         *         name="id",
         *         in="path",
         *         required=true,
         *         @OA\Schema(type="integer")
         *     ),
         *     @OA\Response(
         *         response=200,
         *         description="Coffret",
         *         @OA\JsonContent(ref="#/components/schemas/Coffret")
         *     ),
         *     @OA\Response(
         *         response=404,
         *         description="Coffret introuvable"
         *     )
         * )
         */
        return response()->json($coffret);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Coffret $coffret)
    {
        /**
         * @OA\Put(
         *     path="/api/coffrets/{id}",
         *     tags={"Coffrets"},
         *     summary="Mettre à jour un coffret",
         *     security={{"bearerAuth": {}}},
         *     @OA\Parameter(
         *         name="id",
         *         in="path",
         *         required=true,
         *         @OA\Schema(type="integer")
         *     ),
         *     @OA\RequestBody(
         *         required=false,
         *         @OA\JsonContent(
         *             @OA\Property(property="name", type="string"),
         *             @OA\Property(property="piece", type="string"),
         *             @OA\Property(property="long", type="number", format="float"),
         *             @OA\Property(property="lat", type="number", format="float"),
         *             @OA\Property(property="status", type="string")
         *         )
         *     ),
         *     @OA\Response(
         *         response=200,
         *         description="Coffret mis à jour"
         *     )
         * )
         */
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
         // Validation des données
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'piece' => 'sometimes|string',
            'long' => 'sometimes|numeric',
            'lat' => 'sometimes|numeric',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        // Mise à jour des champs fournis
        $coffret->update($request->only(['name', 'piece', 'long', 'lat', 'status']));

        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret mis à jour avec succès.',
            'coffret' => $coffret,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Coffret $coffret)
    {
        /**
         * @OA\Delete(
         *     path="/api/coffrets/{id}",
         *     tags={"Coffrets"},
         *     summary="Supprimer un coffret",
         *     security={{"bearerAuth": {}}},
         *     @OA\Parameter(
         *         name="id",
         *         in="path",
         *         required=true,
         *         @OA\Schema(type="integer")
         *     ),
         *     @OA\Response(
         *         response=200,
         *         description="Coffret supprimé"
         *     )
         * )
         */
        $coffret->delete();

        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret supprimé avec succès.',
        ], 200);  
    }
}
