<?php

namespace App\Http\Controllers;

use App\Models\Coffret;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

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
        $query = Coffret::with('equipements', 'metrics', 'batiment', 'salle', 'site', 'zone');

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
            'nom' => 'required|string|max:255',
            'modele' => 'nullable|string|max:255',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'piece' => 'nullable|string|max:255',
            'emplacement' => 'nullable|string|max:255',
            'long' => 'nullable|numeric',
            'lat' => 'nullable|numeric',
            'site_id' => 'required|exists:sites,id',
            'zone_id' => 'required|exists:zones,id',
            'batiment_id' => 'required|exists:batiments,id',
            'salle_id' => 'required|exists:salles,id',
            'status' => 'sometimes|in:active,inactive',
        ]);

        // Générer automatiquement le code si non fourni
        $code = $request->code;
        if (empty($code)) {
            $code = $this->generateCoffretCode();
        }

        $coffret = Coffret::create([
            'code' => $code,
            'nom' => $request->nom,
            'modele' => $request->modele ?? null,
            'piece' => $request->piece ?? '',
            'emplacement' => $request->emplacement ?? null,
            'long' => $request->long ?? 0,
            'lat' => $request->lat ?? 0,
            'site_id' => $request->site_id,
            'zone_id' => $request->zone_id,
            'batiment_id' => $request->batiment_id,
            'salle_id' => $request->salle_id,
            'status' => $request->status ?? 'active',
        ]);

        // Gérer l'upload de photo si présent
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('coffrets', 'public');
            $coffret->update(['photo' => $path]);
        }

        // Générer et stocker le QR code
        $qrCode = $this->generateQRCode($coffret);
        $coffret->update(['qr_code' => $qrCode]);
        $coffret->refresh();
    
        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret créé avec succès.',
            'data' => $coffret,
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
        // Générer le QR code s'il n'existe pas
        if (!$coffret->qr_code) {
            $qrCode = $this->generateQRCode($coffret);
            $coffret->update(['qr_code' => $qrCode]);
            $coffret->refresh();
        }

        return response()->json([
            'data' => $coffret->load('equipements', 'metrics', 'batiment', 'salle', 'site', 'zone')
        ]);
    }

    /**
     * Génère un QR code pour un coffret
     */
    private function generateQRCode(Coffret $coffret): string
    {
        // Créer les données à encoder dans le QR code
        $qrData = json_encode([
            'id' => $coffret->id,
            'code' => $coffret->code,
            'nom' => $coffret->nom,
            'type' => 'coffret'
        ]);

        // Générer le QR code en format SVG (string)
        $qrCode = QrCode::size(300)
            ->format('svg')
            ->generate($qrData);

        return $qrCode;
    }

    /**
     * Génère un code coffret unique au format CF-001, CF-002, etc.
     */
    private function generateCoffretCode(): string
    {
        // Récupérer tous les coffrets avec un code au format CF-XXX
        $coffrets = Coffret::where('code', 'like', 'CF-%')
            ->get();

        $maxNumber = 0;
        
        foreach ($coffrets as $coffret) {
            // Extraire le numéro du code (après "CF-")
            $code = $coffret->code;
            if (preg_match('/^CF-(\d+)$/', $code, $matches)) {
                $number = (int) $matches[1];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        }

        // Incrémenter pour obtenir le prochain numéro
        $newNumber = $maxNumber + 1;

        // Formater avec des zéros à gauche (CF-001, CF-002, etc.)
        return 'CF-' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
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
            'code' => 'sometimes|string|max:255|unique:coffrets,code,' . $coffret->id,
            'nom' => 'sometimes|string|max:255',
            'modele' => 'sometimes|string|max:255|nullable',
            'photo' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:4096|nullable',
            'piece' => 'sometimes|string|max:255',
            'emplacement' => 'sometimes|string|max:255|nullable',
            'long' => 'sometimes|numeric',
            'lat' => 'sometimes|numeric',
            'site_id' => 'sometimes|exists:sites,id',
            'zone_id' => 'sometimes|exists:zones,id',
            'batiment_id' => 'sometimes|exists:batiments,id',
            'salle_id' => 'sometimes|exists:salles,id',
            'status' => 'sometimes|in:active,inactive',
        ]);

        // Mise à jour des champs fournis
        $coffret->update($request->only(['code', 'nom', 'modele', 'piece', 'emplacement', 'long', 'lat', 'site_id', 'zone_id', 'batiment_id', 'salle_id', 'status']));

        // Upload de nouvelle photo si fournie
        if ($request->hasFile('photo')) {
            // Optionnel: supprimer l'ancienne si stockée
            // if ($coffret->photo) { \Illuminate\Support\Facades\Storage::disk('public')->delete($coffret->photo); }
            $path = $request->file('photo')->store('coffrets', 'public');
            $coffret->update(['photo' => $path]);
        }

        // Régénérer le QR code si le code ou le nom a changé
        if ($request->has('code') || $request->has('nom')) {
            $qrCode = $this->generateQRCode($coffret);
            $coffret->update(['qr_code' => $qrCode]);
            $coffret->refresh();
        }

        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret mis à jour avec succès.',
            'data' => $coffret,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    /**
     * Retourne l'image d'un coffret
     */
    public function photo(Coffret $coffret)
    {
        if (!$coffret->photo) {
            return response()->json(['message' => 'Photo non trouvée'], 404);
        }

        $path = storage_path('app/public/' . $coffret->photo);
        
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier image non trouvé'], 404);
        }

        // Déterminer le type MIME
        $mimeType = mime_content_type($path);
        if (!$mimeType) {
            $mimeType = 'image/jpeg'; // Par défaut
        }

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000', // Cache pour 1 an
        ]);
    }

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
