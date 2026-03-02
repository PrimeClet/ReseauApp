<?php

namespace App\Services;

use App\Models\Batiment;
use App\Models\Salle;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class SalleService
{
    /**
     * List salles with filters, search, and pagination.
     */
    public function list(Request $request): LengthAwarePaginator
    {
        $query = Salle::with('batiment');

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

        return $query->orderBy('id', 'desc')->paginate($perPage);
    }

    /**
     * Show a single salle with its batiment.
     */
    public function find(Salle $salle): Salle
    {
        return $salle->load('batiment');
    }

    /**
     * Create a new salle with default values.
     */
    public function create(array $data): Salle
    {
        $data['etage'] = $data['etage'] ?? 0;
        $data['capacite'] = $data['capacite'] ?? 0;
        $data['etat'] = $data['etat'] ?? 'Actif';

        $salle = Salle::create($data);
        $salle->load('batiment');

        return $salle;
    }

    /**
     * Update an existing salle.
     */
    public function update(Salle $salle, array $data): Salle
    {
        $salle->update($data);
        $salle->load('batiment');

        return $salle;
    }

    /**
     * Soft-delete a salle.
     */
    public function delete(Salle $salle): void
    {
        $salle->delete();
    }

    /**
     * Restore a soft-deleted salle.
     */
    public function restore(int $id): Salle
    {
        $salle = Salle::withTrashed()->findOrFail($id);
        $salle->restore();
        $salle->load('batiment');

        return $salle;
    }

    /**
     * Import salles from a CSV file with building lookup.
     *
     * @return array{created: int, updated: int, errors: array}
     */
    public function importFromCsv(\Illuminate\Http\UploadedFile $file): array
    {
        $handle = fopen($file->getPathname(), 'r');

        if (! $handle) {
            return ['created' => 0, 'updated' => 0, 'errors' => ['Impossible de lire le fichier.']];
        }

        $header = fgetcsv($handle, 0, ',');
        if (! $header) {
            fclose($handle);

            return ['created' => 0, 'updated' => 0, 'errors' => ['Fichier CSV vide ou invalide.']];
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

            $nom = $data['nom'] ?? null;
            if (empty($nom)) {
                $errors[] = "Ligne {$lineNumber}: le nom est requis";

                continue;
            }

            // Trouver le batiment par nom
            $batimentNom = $data['batiment'] ?? null;
            $batiment = null;
            if (! empty($batimentNom)) {
                $batiment = Batiment::where('nom', $batimentNom)->first();
                if (! $batiment) {
                    $errors[] = "Ligne {$lineNumber}: bâtiment '{$batimentNom}' non trouvé";

                    continue;
                }
            }

            // Chercher si la salle existe deja (par nom et batiment)
            $salleQuery = Salle::withTrashed()->where('nom', $nom);
            if ($batiment) {
                $salleQuery->where('batiment_id', $batiment->id);
            }
            $salle = $salleQuery->first();

            if ($salle) {
                if ($batiment) {
                    $salle->batiment_id = $batiment->id;
                }
                if (isset($data['etage'])) {
                    $salle->etage = (int) $data['etage'];
                }
                if (isset($data['capacite'])) {
                    $salle->capacite = (int) $data['capacite'];
                }
                if (isset($data['type'])) {
                    $salle->type = $data['type'];
                }
                if (isset($data['description'])) {
                    $salle->description = $data['description'];
                }
                if ($salle->trashed()) {
                    $salle->restore();
                }
                $salle->save();
                $updated++;
            } else {
                if (! $batiment) {
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

        return [
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
        ];
    }
}
