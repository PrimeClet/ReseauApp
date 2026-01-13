<?php

namespace App\Http\Controllers;

use App\Models\Salle;
use App\Models\Batiment;
use Illuminate\Http\Request;

class SalleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Salle::with('batiment');

        // Filtrer les supprimés ou non
        if ($request->has('with_trashed') && $request->with_trashed === 'true') {
            $query->withTrashed();
        } elseif ($request->has('only_trashed') && $request->only_trashed === 'true') {
            $query->onlyTrashed();
        }

        if ($request->has('etat')) {
            $query->where('etat', $request->etat);
        }

        if ($request->has('batiment_id')) {
            $query->where('batiment_id', $request->batiment_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('etage', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $salles = $query->orderBy('nom')->paginate($perPage);

        return response()->json($salles);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'nom' => 'required|string|max:255',
            'batiment_id' => 'required|exists:batiments,id',
            'etage' => 'nullable|integer',
            'capacite' => 'required|integer|min:1',
            'type' => 'required|string|max:255',
            'etat' => 'nullable|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ]);

        $data = $request->all();
        $data['etage'] = $request->input('etage', 0);
        $data['etat'] = $request->input('etat', 'Actif');

        $salle = Salle::create($data);
        $salle->load('batiment');

        return response()->json([
            'message' => 'Salle créée avec succès.',
            'data' => $salle,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Salle $salle)
    {
        $salle->load('batiment');

        return response()->json([
            'data' => $salle,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Salle $salle)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'nom' => 'sometimes|string|max:255',
            'batiment_id' => 'sometimes|exists:batiments,id',
            'etage' => 'nullable|integer',
            'capacite' => 'sometimes|integer|min:1',
            'type' => 'sometimes|string|max:255',
            'etat' => 'sometimes|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ]);

        $salle->update($request->all());
        $salle->load('batiment');

        return response()->json([
            'message' => 'Salle mise à jour avec succès.',
            'data' => $salle,
        ], 200);
    }

    /**
     * Remove the specified resource from storage (soft delete).
     */
    public function destroy(Salle $salle)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $salle->delete();

        return response()->json([
            'message' => 'Salle supprimée avec succès.',
        ], 200);
    }

    /**
     * Restore a soft deleted salle.
     */
    public function restore($id)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $salle = Salle::withTrashed()->findOrFail($id);
        $salle->restore();
        $salle->load('batiment');

        return response()->json([
            'message' => 'Salle restaurée avec succès.',
            'data' => $salle,
        ], 200);
    }

    /**
     * Import salles from CSV file.
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

            // Trouver le bâtiment par nom
            $batimentNom = $data['batiment'] ?? null;
            $batiment = null;
            if (!empty($batimentNom)) {
                $batiment = Batiment::where('nom', $batimentNom)->first();
                if (!$batiment) {
                    $errors[] = "Ligne {$lineNumber}: bâtiment '{$batimentNom}' non trouvé";
                    continue;
                }
            }

            // Chercher si la salle existe déjà (par nom et bâtiment)
            $salleQuery = Salle::withTrashed()->where('nom', $nom);
            if ($batiment) {
                $salleQuery->where('batiment_id', $batiment->id);
            }
            $salle = $salleQuery->first();

            if ($salle) {
                // Mise à jour
                if ($batiment) $salle->batiment_id = $batiment->id;
                if (isset($data['etage'])) $salle->etage = (int) $data['etage'];
                if (isset($data['capacite'])) $salle->capacite = (int) $data['capacite'];
                if (isset($data['type'])) $salle->type = $data['type'];
                if (isset($data['description'])) $salle->description = $data['description'];
                if ($salle->trashed()) {
                    $salle->restore();
                }
                $salle->save();
                $updated++;
            } else {
                // Création
                if (!$batiment) {
                    $errors[] = "Ligne {$lineNumber}: le bâtiment est requis pour créer une salle";
                    continue;
                }
                Salle::create([
                    'nom' => $nom,
                    'batiment_id' => $batiment->id,
                    'etage' => isset($data['etage']) && $data['etage'] !== '' ? (int) $data['etage'] : 0,
                    'capacite' => isset($data['capacite']) ? (int) $data['capacite'] : 10,
                    'type' => $data['type'] ?? 'Bureau',
                    'etat' => 'Actif',
                    'description' => $data['description'] ?? null,
                ]);
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
