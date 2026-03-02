<?php

namespace App\Services;

use App\Models\Batiment;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class BatimentService
{
    /**
     * List batiments with filters, search, and pagination.
     */
    public function list(Request $request): LengthAwarePaginator
    {
        $query = Batiment::query();

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

        return $query->with('zone')
            ->withCount('salles')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Show a single batiment with its relationships.
     */
    public function find(Batiment $batiment): Batiment
    {
        $batiment->load('zone');
        $batiment->loadCount('salles');

        return $batiment;
    }

    /**
     * Create a new batiment.
     */
    public function create(array $data): Batiment
    {
        $batiment = Batiment::create($data);
        $batiment->load('zone');

        return $batiment;
    }

    /**
     * Update an existing batiment.
     */
    public function update(Batiment $batiment, array $data): Batiment
    {
        $batiment->update($data);
        $batiment->load('zone');

        return $batiment;
    }

    /**
     * Soft-delete a batiment.
     */
    public function delete(Batiment $batiment): void
    {
        $batiment->delete();
    }

    /**
     * Restore a soft-deleted batiment.
     */
    public function restore(int $id): Batiment
    {
        $batiment = Batiment::withTrashed()->findOrFail($id);
        $batiment->restore();
        $batiment->load('zone');

        return $batiment;
    }

    /**
     * Permanently delete a batiment.
     */
    public function forceDelete(int $id): void
    {
        $batiment = Batiment::withTrashed()->findOrFail($id);
        $batiment->forceDelete();
    }

    /**
     * Import batiments from a CSV file.
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

            $batiment = Batiment::withTrashed()->where('nom', $nom)->first();

            if ($batiment) {
                $batiment->description = $data['description'] ?? $batiment->description;
                if ($batiment->trashed()) {
                    $batiment->restore();
                }
                $batiment->save();
                $updated++;
            } else {
                Batiment::create([
                    'nom' => $nom,
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
