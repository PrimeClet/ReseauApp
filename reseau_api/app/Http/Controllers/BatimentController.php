<?php

namespace App\Http\Controllers;

use App\Models\Batiment;
use Illuminate\Http\Request;

class BatimentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Batiment::query();

        // Filtrer les supprimés ou non
        if ($request->has('with_trashed') && $request->with_trashed === 'true') {
            $query->withTrashed();
        } elseif ($request->has('only_trashed') && $request->only_trashed === 'true') {
            $query->onlyTrashed();
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $batiments = $query->withCount('salles')->orderBy('nom')->paginate($perPage);

        return response()->json($batiments);
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
            'description' => 'nullable|string',
        ]);

        $batiment = Batiment::create($request->only(['nom', 'description']));

        return response()->json([
            'message' => 'Bâtiment créé avec succès.',
            'data' => $batiment,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Batiment $batiment)
    {
        $batiment->loadCount('salles');

        return response()->json([
            'data' => $batiment,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Batiment $batiment)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'nom' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $batiment->update($request->only(['nom', 'description']));

        return response()->json([
            'message' => 'Bâtiment mis à jour avec succès.',
            'data' => $batiment,
        ], 200);
    }

    /**
     * Remove the specified resource from storage (soft delete).
     */
    public function destroy(Batiment $batiment)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $batiment->delete();

        return response()->json([
            'message' => 'Bâtiment supprimé avec succès.',
        ], 200);
    }

    /**
     * Restore a soft deleted batiment.
     */
    public function restore($id)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $batiment = Batiment::withTrashed()->findOrFail($id);
        $batiment->restore();

        return response()->json([
            'message' => 'Bâtiment restauré avec succès.',
            'data' => $batiment,
        ], 200);
    }

    /**
     * Force delete a batiment permanently.
     */
    public function forceDelete($id)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $batiment = Batiment::withTrashed()->findOrFail($id);
        $batiment->forceDelete();

        return response()->json([
            'message' => 'Bâtiment supprimé définitivement.',
        ], 200);
    }

    /**
     * Import batiments from CSV file.
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

            // Chercher si le bâtiment existe déjà
            $batiment = Batiment::withTrashed()->where('nom', $nom)->first();

            if ($batiment) {
                // Mise à jour
                $batiment->description = $data['description'] ?? $batiment->description;
                if ($batiment->trashed()) {
                    $batiment->restore();
                }
                $batiment->save();
                $updated++;
            } else {
                // Création
                Batiment::create([
                    'nom' => $nom,
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
