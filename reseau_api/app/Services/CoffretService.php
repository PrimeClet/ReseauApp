<?php

namespace App\Services;

use App\Models\Batiment;
use App\Models\Coffret;
use App\Models\Salle;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CoffretService
{
    public function list(Request $request)
    {
        $query = Coffret::with('equipements', 'metrics', 'batiment', 'salle', 'site', 'zone');

        if ($request->get('with_trashed') === 'true') {
            $query->withTrashed();
        } elseif ($request->get('only_trashed') === 'true') {
            $query->onlyTrashed();
        }

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

        return $query->orderBy('id', 'desc')->paginate($perPage);
    }

    public function create(array $data, $photoFile = null): Coffret
    {
        $code = $data['code'] ?? $this->generateCode();

        $coffret = Coffret::create([
            'code' => $code,
            'nom' => $data['nom'],
            'modele' => $data['modele'] ?? null,
            'emplacement' => $data['emplacement'] ?? null,
            'long' => $data['long'] ?? 0,
            'lat' => $data['lat'] ?? 0,
            'site_id' => $data['site_id'],
            'zone_id' => $data['zone_id'],
            'batiment_id' => $data['batiment_id'],
            'salle_id' => $data['salle_id'],
            'status' => $data['status'] ?? 'active',
        ]);

        if ($photoFile) {
            $path = $photoFile->store('coffrets', 'public');
            $coffret->update(['photo' => $path]);
        }

        $qrCode = $this->generateQRCode($coffret);
        $coffret->update(['qr_code' => $qrCode]);
        $coffret->refresh();

        return $coffret;
    }

    public function find(Coffret $coffret): Coffret
    {
        if (! $coffret->qr_code) {
            $qrCode = $this->generateQRCode($coffret);
            $coffret->update(['qr_code' => $qrCode]);
            $coffret->refresh();
        }

        return $coffret->load('equipements', 'metrics', 'batiment', 'salle', 'site', 'zone');
    }

    public function update(Coffret $coffret, array $data, $photoFile = null): Coffret
    {
        $coffret->update(collect($data)->only([
            'code', 'nom', 'modele', 'emplacement', 'long', 'lat',
            'site_id', 'zone_id', 'batiment_id', 'salle_id', 'status',
        ])->toArray());

        if ($photoFile) {
            $path = $photoFile->store('coffrets', 'public');
            $coffret->update(['photo' => $path]);
        }

        if (isset($data['code']) || isset($data['nom'])) {
            $qrCode = $this->generateQRCode($coffret);
            $coffret->update(['qr_code' => $qrCode]);
            $coffret->refresh();
        }

        return $coffret;
    }

    public function delete(Coffret $coffret): void
    {
        $coffret->delete();
    }

    public function restore(int $id): Coffret
    {
        $coffret = Coffret::withTrashed()->findOrFail($id);
        $coffret->restore();
        $coffret->load('equipements', 'metrics', 'batiment', 'salle');

        return $coffret;
    }

    public function import($file): array
    {
        $handle = fopen($file->getPathname(), 'r');

        if (! $handle) {
            throw new \RuntimeException('Impossible de lire le fichier.');
        }

        $header = fgetcsv($handle, 0, ',');
        if (! $header) {
            fclose($handle);
            throw new \RuntimeException('Fichier CSV vide ou invalide.');
        }

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

            $batiment = null;
            if (! empty($data['batiment'])) {
                $batiment = Batiment::where('nom', $data['batiment'])->first();
                if (! $batiment) {
                    $errors[] = "Ligne {$lineNumber}: bâtiment '{$data['batiment']}' non trouvé";

                    continue;
                }
            }

            $salle = null;
            if (! empty($data['salle'])) {
                $salleQuery = Salle::where('nom', $data['salle']);
                if ($batiment) {
                    $salleQuery->where('batiment_id', $batiment->id);
                }
                $salle = $salleQuery->first();
                if (! $salle) {
                    $errors[] = "Ligne {$lineNumber}: salle '{$data['salle']}' non trouvée";

                    continue;
                }
            }

            $coffret = Coffret::withTrashed()->where('nom', $nom)->first();

            if ($coffret) {
                if ($batiment) {
                    $coffret->batiment_id = $batiment->id;
                }
                if ($salle) {
                    $coffret->salle_id = $salle->id;
                }
                if (isset($data['status'])) {
                    $coffret->status = $data['status'];
                }
                if ($coffret->trashed()) {
                    $coffret->restore();
                }
                $coffret->save();
                $updated++;
            } else {
                $code = $this->generateCode();
                $newCoffret = Coffret::create([
                    'code' => $code,
                    'nom' => $nom,
                    'batiment_id' => $batiment?->id,
                    'salle_id' => $salle?->id,
                    'long' => isset($data['long']) && $data['long'] !== '' ? (float) $data['long'] : 0,
                    'lat' => isset($data['lat']) && $data['lat'] !== '' ? (float) $data['lat'] : 0,
                    'status' => $data['status'] ?? 'active',
                ]);
                $qrCode = $this->generateQRCode($newCoffret);
                $newCoffret->update(['qr_code' => $qrCode]);
                $created++;
            }
        }

        fclose($handle);

        return compact('created', 'updated', 'errors');
    }

    public function generateCode(): string
    {
        $maxNumber = 0;

        Coffret::where('code', 'like', 'CF-%')->get()->each(function ($coffret) use (&$maxNumber) {
            if (preg_match('/^CF-(\d+)$/', $coffret->code, $matches)) {
                $number = (int) $matches[1];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        });

        return 'CF-'.str_pad($maxNumber + 1, 3, '0', STR_PAD_LEFT);
    }

    public function generateQRCode(Coffret $coffret): string
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $qrData = "{$frontendUrl}/armoires/{$coffret->code}/details";

        return QrCode::size(300)->format('svg')->generate($qrData);
    }
}
