<?php

namespace App\Services;

use App\Models\Equipement;
use App\Models\Liaison;
use App\Models\Port;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class EquipementService
{
    public function list(Request $request)
    {
        $query = Equipement::query();

        if ($request->get('with_trashed') === 'true') {
            $query->withTrashed();
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $equipements = $query->with('coffret.batiment', 'coffret.salle', 'batiment', 'salle', 'ports')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        foreach ($equipements->items() as $equipement) {
            if (! $equipement->qr_code) {
                $qrCode = $this->generateQRCode($equipement);
                $equipement->update(['qr_code' => $qrCode]);
                $equipement->refresh();
            }
        }

        return $equipements;
    }

    public function create(array $data): Equipement
    {
        $data['equipement_code'] = $data['equipement_code'] ?? $this->generateCode();

        $equipement = Equipement::create($data);

        $qrCode = $this->generateQRCode($equipement);
        $equipement->update(['qr_code' => $qrCode]);
        $equipement->refresh();

        return $equipement;
    }

    public function find(Equipement $equipement): Equipement
    {
        if (! $equipement->qr_code) {
            $qrCode = $this->generateQRCode($equipement);
            $equipement->update(['qr_code' => $qrCode]);
            $equipement->refresh();
        }

        $relations = ['coffret.batiment', 'coffret.salle', 'batiment', 'salle', 'ports'];
        if ($equipement->is_manageable && strtolower($equipement->type) === 'switch') {
            $relations[] = 'vlans';
        }

        return $equipement->load($relations);
    }

    public function update(Equipement $equipement, array $data): Equipement
    {
        $equipement->update($data);

        if (isset($data['equipement_code']) || isset($data['name'])) {
            $qrCode = $this->generateQRCode($equipement);
            $equipement->update(['qr_code' => $qrCode]);
            $equipement->refresh();
        }

        return $equipement;
    }

    public function delete(Equipement $equipement): void
    {
        $equipement->delete();
    }

    public function findByCode(string $code): ?Equipement
    {
        return Equipement::where('equipement_code', $code)
            ->with('coffret.batiment', 'coffret.salle', 'batiment', 'salle', 'ports')
            ->first();
    }

    // --- VLAN Management ---

    public function getVlans(Equipement $equipement)
    {
        return $equipement->vlans;
    }

    public function attachVlan(Equipement $equipement, int $lanId, bool $isTagged = true, ?string $ports = null): Equipement
    {
        $equipement->vlans()->attach($lanId, [
            'is_tagged' => $isTagged,
            'ports' => $ports,
        ]);

        return $equipement->load('vlans');
    }

    public function detachVlan(Equipement $equipement, int $lanId): Equipement
    {
        $equipement->vlans()->detach($lanId);

        return $equipement->load('vlans');
    }

    public function updateVlanConfig(Equipement $equipement, int $lanId, bool $isTagged = true, ?string $ports = null): Equipement
    {
        $equipement->vlans()->updateExistingPivot($lanId, [
            'is_tagged' => $isTagged,
            'ports' => $ports,
        ]);

        return $equipement->load('vlans');
    }

    // --- Prises Murales ---

    public function listPrisesMurales(Request $request)
    {
        $query = Equipement::where('type', 'prise_murale');

        if ($request->get('with_trashed') === 'true') {
            $query->withTrashed();
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('equipement_code', 'like', "%{$search}%");
            });
        }

        if ($request->has('salle_id')) {
            $query->where('salle_id', $request->salle_id);
        }

        if ($request->has('batiment_id')) {
            $query->where('batiment_id', $request->batiment_id);
        }

        $perPage = (int) $request->get('per_page', 50);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 50;

        return $query->with(['salle.batiment', 'batiment', 'ports.liaisonsAsDestination.fromPort.equipement'])
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function createPriseMurale(array $data): array
    {
        $this->validateSwitchPortsAvailability(
            collect($data['ports'])->pluck('switch_port_id')->toArray()
        );

        return DB::transaction(function () use ($data) {
            return $this->buildPriseMurale($data);
        });
    }

    public function createPrisesMuralesBulk(array $globalData, array $prises): array
    {
        $allSwitchPortIds = collect($prises)
            ->pluck('ports')->flatten(1)
            ->pluck('switch_port_id')->toArray();

        $this->validateSwitchPortsAvailability($allSwitchPortIds);

        return DB::transaction(function () use ($globalData, $prises) {
            $createdPrises = [];

            foreach ($prises as $priseData) {
                $data = array_merge($priseData, [
                    'salle_id' => $globalData['salle_id'],
                    'batiment_id' => $globalData['batiment_id'] ?? null,
                    'type_prise' => $globalData['type_prise'],
                    'status' => $globalData['status'] ?? 'active',
                ]);

                $createdPrises[] = $this->buildPriseMurale($data);
            }

            return $createdPrises;
        });
    }

    public function getPrisesMuralesStats(): array
    {
        $total = Equipement::where('type', 'prise_murale')->count();
        $actives = Equipement::where('type', 'prise_murale')->where('status', 'active')->count();
        $inactives = Equipement::where('type', 'prise_murale')->where('status', 'inactive')->count();

        $connectees = Equipement::where('type', 'prise_murale')
            ->whereHas('ports', function ($q) {
                $q->whereHas('liaisonsAsDestination');
            })
            ->count();

        return [
            'total' => $total,
            'actives' => $actives,
            'inactives' => $inactives,
            'connectees' => $connectees,
            'non_connectees' => $total - $connectees,
        ];
    }

    // --- Private Helpers ---

    public function generateCode(): string
    {
        $maxNumber = 0;

        Equipement::where('equipement_code', 'like', 'EQ-%')->get()->each(function ($eq) use (&$maxNumber) {
            if (preg_match('/^EQ-(\d+)$/', $eq->equipement_code, $matches)) {
                $number = (int) $matches[1];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        });

        return 'EQ-'.str_pad($maxNumber + 1, 3, '0', STR_PAD_LEFT);
    }

    public function generateQRCode(Equipement $equipement): string
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $qrData = "{$frontendUrl}/equipements/{$equipement->equipement_code}/details";

        return QrCode::size(300)->format('svg')->generate($qrData);
    }

    private function generatePriseMuraleCode(): string
    {
        $maxNumber = 0;

        Equipement::where('equipement_code', 'like', 'PM-%')->get()->each(function ($prise) use (&$maxNumber) {
            if (preg_match('/^PM-(\d+)$/', $prise->equipement_code, $matches)) {
                $number = (int) $matches[1];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        });

        return 'PM-'.str_pad($maxNumber + 1, 4, '0', STR_PAD_LEFT);
    }

    private function validateSwitchPortsAvailability(array $switchPortIds): void
    {
        if (count($switchPortIds) !== count(array_unique($switchPortIds))) {
            throw new \InvalidArgumentException('Chaque port de switch ne peut être utilisé qu\'une seule fois.');
        }

        $alreadyUsed = Liaison::where(function ($q) use ($switchPortIds) {
            $q->whereIn('from', $switchPortIds)->orWhereIn('to', $switchPortIds);
        })->whereNull('deleted_at')->exists();

        if ($alreadyUsed) {
            throw new \InvalidArgumentException('Un ou plusieurs ports switch sont déjà utilisés dans des liaisons existantes.');
        }
    }

    private function buildPriseMurale(array $data): array
    {
        $priseCode = $this->generatePriseMuraleCode();
        $typePrise = $data['type_prise'] ?? 'RJ45';

        $prise = Equipement::create([
            'equipement_code' => $priseCode,
            'name' => $data['name'],
            'type' => 'prise_murale',
            'modele' => $typePrise,
            'description' => $data['emplacement'] ?? null,
            'salle_id' => $data['salle_id'],
            'batiment_id' => $data['batiment_id'] ?? null,
            'coffret_id' => null,
            'status' => $data['status'] ?? 'active',
            'type_reseau' => 'IT',
        ]);

        $qrCode = $this->generateQRCode($prise);
        $prise->update(['qr_code' => $qrCode]);

        $ports = [];
        $liaisons = [];

        foreach ($data['ports'] as $index => $portData) {
            $portNumber = $index + 1;

            $port = Port::create([
                'port_label' => $typePrise.'-'.$portNumber,
                'device_name' => $data['name'],
                'poe_enabled' => false,
                'type_reseau' => 'IT',
                'statut' => 'actif',
                'port_genre' => 'downlink',
                'equipement_id' => $prise->id,
            ]);

            $switchPort = Port::find($portData['switch_port_id']);
            $switchEquipement = $switchPort?->equipement;
            $liaisonLabel = $switchEquipement
                ? "{$switchEquipement->name}-{$data['name']}"
                : "Liaison-{$data['name']}";

            $media = $portData['liaison_media'] ?? 'Cuivre Cat6';
            $mediaShort = str_contains(strtolower($media), 'fibre') ? 'Fo' : 'Cu';
            $liaisonLabel .= "-P{$portNumber}-{$mediaShort}";

            $liaison = Liaison::create([
                'from' => $portData['switch_port_id'],
                'to' => $port->id,
                'direction' => 'down',
                'label' => $liaisonLabel,
                'media' => $media,
                'length' => $portData['liaison_length'] ?? null,
                'status' => true,
            ]);

            $ports[] = $port;
            $liaisons[] = $liaison;
        }

        $prise->load(['salle.batiment', 'batiment', 'ports']);

        return [
            'prise' => $prise,
            'ports' => $ports,
            'liaisons' => $liaisons,
        ];
    }
}
