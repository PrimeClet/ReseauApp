<?php

namespace App\Http\Controllers;

use App\Models\Coffret;
use App\Models\Batiment;
use App\Models\Salle;
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
        $query = Coffret::with('equipements', 'metrics', 'batiment', 'salle');

        // Filtrer les supprimés ou non
        if ($request->has('with_trashed') && $request->with_trashed === 'true') {
            $query->withTrashed();
        } elseif ($request->has('only_trashed') && $request->only_trashed === 'true') {
            $query->onlyTrashed();
        }

        // Filtrage par statut et recherche par nom
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('batiment_id')) {
            $query->where('batiment_id', $request->batiment_id);
        }

        if ($request->has('salle_id')) {
            $query->where('salle_id', $request->salle_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $coffrets = $query->orderBy('nom')->paginate($perPage);

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
            'piece' => 'nullable|string|max:255',
            'long' => 'nullable|numeric',
            'lat' => 'nullable|numeric',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
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
            'piece' => $request->piece ?? '',
            'long' => $request->long ?? 0,
            'lat' => $request->lat ?? 0,
            'batiment_id' => $request->batiment_id,
            'salle_id' => $request->salle_id,
            'status' => $request->status ?? 'active',
        ]);

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
            'data' => $coffret->load('equipements', 'metrics', 'batiment', 'salle')
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
            'piece' => 'sometimes|string|max:255',
            'long' => 'sometimes|numeric',
            'lat' => 'sometimes|numeric',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
            'status' => 'sometimes|in:active,inactive',
        ]);

        // Mise à jour des champs fournis
        $coffret->update($request->only(['code', 'nom', 'piece', 'long', 'lat', 'batiment_id', 'salle_id', 'status']));

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

    /**
     * Restore a soft deleted coffret.
     */
    public function restore($id)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $coffret = Coffret::withTrashed()->findOrFail($id);
        $coffret->restore();
        $coffret->load('equipements', 'metrics', 'batiment', 'salle');

        return response()->json([
            'message' => 'Coffret restauré avec succès.',
            'data' => $coffret,
        ], 200);
    }

    /**
     * Import coffrets from CSV file.
     */
    public function import(Request $request)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');

        if (!$handle) {
            return response()->json(['message' => 'Impossible de lire le fichier.'], 400);
        }

        $header = fgetcsv($handle, 0, ',');
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'Fichier CSV vide ou invalide.'], 400);
        }

        // Normaliser les headers (enlever BOM, trim, lowercase)
        $header = array_map(function ($h) {
            return strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h)));
        }, $header);

        $created = 0;
        $updated = 0;
        $errors = [];
        $lineNumber = 1;

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $lineNumber++;

            if (count($row) !== count($header)) {
                $errors[] = "Ligne {$lineNumber}: nombre de colonnes incorrect";
                continue;
            }

            $data = array_combine($header, $row);

            // Vérifier que le nom existe
            $nom = $data['nom'] ?? null;
            if (empty($nom)) {
                $errors[] = "Ligne {$lineNumber}: le nom est requis";
                continue;
            }

            // Trouver le bâtiment par nom si fourni
            $batiment = null;
            if (!empty($data['batiment'])) {
                $batiment = Batiment::where('nom', $data['batiment'])->first();
                if (!$batiment) {
                    $errors[] = "Ligne {$lineNumber}: bâtiment '{$data['batiment']}' non trouvé";
                    continue;
                }
            }

            // Trouver la salle par nom si fournie
            $salle = null;
            if (!empty($data['salle'])) {
                $salleQuery = Salle::where('nom', $data['salle']);
                if ($batiment) {
                    $salleQuery->where('batiment_id', $batiment->id);
                }
                $salle = $salleQuery->first();
                if (!$salle) {
                    $errors[] = "Ligne {$lineNumber}: salle '{$data['salle']}' non trouvée";
                    continue;
                }
            }

            // Chercher si le coffret existe déjà (par nom ou code)
            $coffretQuery = Coffret::withTrashed()->where('nom', $nom);
            $coffret = $coffretQuery->first();

            if ($coffret) {
                // Mise à jour
                if ($batiment) $coffret->batiment_id = $batiment->id;
                if ($salle) $coffret->salle_id = $salle->id;
                if (isset($data['piece'])) $coffret->piece = $data['piece'];
                if (isset($data['status'])) $coffret->status = $data['status'];
                if ($coffret->trashed()) {
                    $coffret->restore();
                }
                $coffret->save();
                $updated++;
            } else {
                // Création
                $code = $this->generateCoffretCode();
                $newCoffret = Coffret::create([
                    'code' => $code,
                    'nom' => $nom,
                    'batiment_id' => $batiment?->id,
                    'salle_id' => $salle?->id,
                    'piece' => $data['piece'] ?? '',
                    'long' => isset($data['long']) && $data['long'] !== '' ? (float) $data['long'] : 0,
                    'lat' => isset($data['lat']) && $data['lat'] !== '' ? (float) $data['lat'] : 0,
                    'status' => $data['status'] ?? 'active',
                ]);
                // Générer le QR code
                $qrCode = $this->generateQRCode($newCoffret);
                $newCoffret->update(['qr_code' => $qrCode]);
                $created++;
            }
        }

        fclose($handle);

        return response()->json([
            'message' => 'Import terminé.',
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
        ], 200);
    }
}
