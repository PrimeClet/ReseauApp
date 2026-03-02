<?php

namespace App\Http\Controllers;

use App\Http\Requests\Equipement\StoreEquipementRequest;
use App\Http\Requests\Equipement\UpdateEquipementRequest;
use App\Models\Equipement;
use App\Services\EquipementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipementsController extends Controller
{
    public function __construct(
        private readonly EquipementService $equipementService,
    ) {}

    // ==========================================
    // CRUD
    // ==========================================

    public function index(Request $request): JsonResponse
    {
        $equipements = $this->equipementService->list($request);

        return $this->paginatedResponse($equipements);
    }

    public function store(StoreEquipementRequest $request): JsonResponse
    {
        $equipement = $this->equipementService->create($request->validated());

        return $this->successResponse($equipement, 'Équipement créé avec succès.', 201);
    }

    public function show(Equipement $equipement): JsonResponse
    {
        return $this->successResponse($this->equipementService->find($equipement));
    }

    public function update(UpdateEquipementRequest $request, Equipement $equipement): JsonResponse
    {
        $equipement = $this->equipementService->update($equipement, $request->validated());

        return $this->successResponse($equipement, 'Équipement mis à jour avec succès.');
    }

    public function destroy(Equipement $equipement): JsonResponse
    {
        $this->equipementService->delete($equipement);

        return $this->successResponse(message: 'Équipement supprimé avec succès.');
    }

    public function findByCode(Request $request): JsonResponse
    {
        $code = $request->get('code');

        if (! $code) {
            return $this->errorResponse('Code requis', 422);
        }

        $equipement = $this->equipementService->findByCode($code);

        if (! $equipement) {
            return $this->errorResponse('Équipement non trouvé', 404);
        }

        return $this->successResponse($equipement);
    }

    // ==========================================
    // VLAN Management
    // ==========================================

    public function getVlans(Equipement $equipement): JsonResponse
    {
        if (! $equipement->is_manageable || strtolower($equipement->type) !== 'switch') {
            return $this->errorResponse('Cet équipement n\'est pas un switch manageable.', 422);
        }

        return $this->successResponse($this->equipementService->getVlans($equipement));
    }

    public function attachVlan(Request $request, Equipement $equipement): JsonResponse
    {
        if (! $equipement->is_manageable || strtolower($equipement->type) !== 'switch') {
            return $this->errorResponse('Cet équipement n\'est pas un switch manageable.', 422);
        }

        $request->validate([
            'lan_id' => 'required|exists:lans,id',
            'is_tagged' => 'nullable|boolean',
            'ports' => 'nullable|string|max:255',
        ]);

        if ($equipement->vlans()->where('lan_id', $request->lan_id)->exists()) {
            return $this->errorResponse('Ce VLAN est déjà configuré sur ce switch.', 422);
        }

        $data = $this->equipementService->attachVlan(
            $equipement, $request->lan_id, $request->get('is_tagged', true), $request->get('ports')
        );

        return $this->successResponse($data, 'VLAN ajouté avec succès.');
    }

    public function detachVlan(Request $request, Equipement $equipement): JsonResponse
    {
        $request->validate(['lan_id' => 'required|exists:lans,id']);

        $data = $this->equipementService->detachVlan($equipement, $request->lan_id);

        return $this->successResponse($data, 'VLAN retiré avec succès.');
    }

    public function updateVlanConfig(Request $request, Equipement $equipement): JsonResponse
    {
        $request->validate([
            'lan_id' => 'required|exists:lans,id',
            'is_tagged' => 'nullable|boolean',
            'ports' => 'nullable|string|max:255',
        ]);

        $data = $this->equipementService->updateVlanConfig(
            $equipement, $request->lan_id, $request->get('is_tagged', true), $request->get('ports')
        );

        return $this->successResponse($data, 'Configuration VLAN mise à jour.');
    }

    public function getManageableSwitches(): JsonResponse
    {
        $switches = Equipement::manageable()
            ->with('coffret', 'vlans')
            ->orderBy('name')
            ->get();

        return $this->successResponse($switches);
    }

    // ==========================================
    // Dependency Chain & Impact Analysis
    // ==========================================

    public function getDependencyChain(Equipement $equipement): JsonResponse
    {
        $maxDepth = (int) request()->get('max_depth', 10);
        $chain = $equipement->getFullDependencyChain($maxDepth);

        $formatChainItem = function ($item) {
            $liaison = $item['liaison'];
            $fromPort = $liaison->fromPort;
            $toPort = $liaison->toPort;

            return [
                'equipement' => [
                    'id' => $item['equipement']->id,
                    'name' => $item['equipement']->name,
                    'type' => $item['equipement']->type,
                    'equipement_code' => $item['equipement']->equipement_code,
                    'ip_address' => $item['equipement']->ip_address,
                    'mac_address' => $item['equipement']->mac_address,
                    'status' => $item['equipement']->status,
                    'is_principal' => $item['equipement']->is_principal,
                    'coffret_id' => $item['equipement']->coffret_id,
                ],
                'liaison' => [
                    'id' => $liaison->id,
                    'direction' => $liaison->direction,
                    'media' => $liaison->media,
                    'cable_type' => $liaison->cable_type,
                    'length' => $liaison->length,
                    'label' => $liaison->label,
                    'status' => $liaison->status,
                ],
                'from_port' => $fromPort ? [
                    'id' => $fromPort->id,
                    'port_label' => $fromPort->port_label,
                    'device_name' => $fromPort->device_name,
                    'speed' => $fromPort->speed,
                    'connexion_type' => $fromPort->connexion_type,
                ] : null,
                'to_port' => $toPort ? [
                    'id' => $toPort->id,
                    'port_label' => $toPort->port_label,
                    'device_name' => $toPort->device_name,
                    'speed' => $toPort->speed,
                    'connexion_type' => $toPort->connexion_type,
                ] : null,
                'depth' => $item['depth'],
            ];
        };

        $upstream = $chain['upstream']->map($formatChainItem);
        $downstream = $chain['downstream']->map($formatChainItem);

        return $this->successResponse([
            'equipement' => [
                'id' => $equipement->id,
                'name' => $equipement->name,
                'type' => $equipement->type,
                'equipement_code' => $equipement->equipement_code,
                'ip_address' => $equipement->ip_address,
                'mac_address' => $equipement->mac_address,
                'status' => $equipement->status,
                'is_principal' => $equipement->is_principal,
            ],
            'upstream' => $upstream->values(),
            'downstream' => $downstream->values(),
            'upstream_count' => $upstream->count(),
            'downstream_count' => $downstream->count(),
        ]);
    }

    public function getImpactAnalysis(Equipement $equipement): JsonResponse
    {
        $impacted = $equipement->getImpactedEquipements();

        $impactedEquipements = $impacted->map(function ($item) {
            return [
                'equipement' => [
                    'id' => $item['equipement']->id,
                    'name' => $item['equipement']->name,
                    'type' => $item['equipement']->type,
                    'equipement_code' => $item['equipement']->equipement_code,
                    'ip_address' => $item['equipement']->ip_address,
                    'status' => $item['equipement']->status,
                    'coffret_id' => $item['equipement']->coffret_id,
                ],
                'depth' => $item['depth'],
            ];
        });

        $byType = $impactedEquipements->groupBy('equipement.type')->map->count();
        $count = $impactedEquipements->count();

        $severity = match (true) {
            $count === 0 => 'none',
            $count <= 2 => 'low',
            $count <= 5 => 'medium',
            $count <= 10 => 'high',
            default => 'critical',
        };

        return $this->successResponse([
            'source_equipement' => [
                'id' => $equipement->id,
                'name' => $equipement->name,
                'type' => $equipement->type,
            ],
            'impacted_equipements' => $impactedEquipements->values(),
            'total_impacted' => $count,
            'impact_by_type' => $byType,
            'severity' => $severity,
        ]);
    }

    // ==========================================
    // Principal Switch
    // ==========================================

    public function getPrincipalSwitch(int $coffretId): JsonResponse
    {
        $principalSwitch = Equipement::where('coffret_id', $coffretId)
            ->where('is_principal', true)
            ->where('type', 'switch')
            ->with('ports')
            ->first();

        if (! $principalSwitch) {
            return $this->errorResponse('Aucun switch principal trouvé pour cette baie.', 404);
        }

        return $this->successResponse($principalSwitch);
    }

    public function setAsPrincipal(Equipement $equipement): JsonResponse
    {
        if (strtolower($equipement->type) !== 'switch') {
            return $this->errorResponse('Seuls les switches peuvent être définis comme principaux.', 422);
        }

        Equipement::where('coffret_id', $equipement->coffret_id)
            ->where('id', '!=', $equipement->id)
            ->update(['is_principal' => false]);

        $equipement->update(['is_principal' => true]);

        return $this->successResponse($equipement->fresh(), 'Switch défini comme principal avec succès.');
    }

    // ==========================================
    // Prises Murales
    // ==========================================

    public function getPrisesMurales(Request $request): JsonResponse
    {
        $prises = $this->equipementService->listPrisesMurales($request);

        return $this->paginatedResponse($prises);
    }

    public function storePriseMurale(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'salle_id' => 'required|exists:salles,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'emplacement' => 'nullable|string|max:255',
            'type_prise' => 'required|in:RJ45,Fibre,Coaxial',
            'status' => 'nullable|in:active,inactive,maintenance',
            'ports' => 'required|array|min:1',
            'ports.*.switch_port_id' => 'required|exists:ports,id',
            'ports.*.liaison_media' => 'nullable|string|max:255',
            'ports.*.liaison_length' => 'nullable|numeric|min:0',
        ]);

        try {
            $result = $this->equipementService->createPriseMurale($request->all());

            return $this->successResponse($result, 'Prise murale créée avec succès.', 201);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            \Log::error('Erreur création prise murale: '.$e->getMessage());

            return $this->errorResponse('Erreur lors de la création de la prise murale.', 500);
        }
    }

    public function storePrisesMuralesBulk(Request $request): JsonResponse
    {
        $request->validate([
            'salle_id' => 'required|exists:salles,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'type_prise' => 'required|in:RJ45,Fibre,Coaxial',
            'status' => 'nullable|in:active,inactive,maintenance',
            'prises' => 'required|array|min:1|max:50',
            'prises.*.name' => 'required|string|max:255',
            'prises.*.emplacement' => 'nullable|string|max:255',
            'prises.*.ports' => 'required|array|min:1',
            'prises.*.ports.*.switch_port_id' => 'required|exists:ports,id',
            'prises.*.ports.*.liaison_media' => 'nullable|string|max:255',
            'prises.*.ports.*.liaison_length' => 'nullable|numeric|min:0',
        ]);

        try {
            $result = $this->equipementService->createPrisesMuralesBulk(
                $request->only(['salle_id', 'batiment_id', 'type_prise', 'status']),
                $request->prises
            );

            return $this->successResponse($result, count($result).' prises murales créées avec succès.', 201);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            \Log::error('Erreur création prises murales en lot: '.$e->getMessage());

            return $this->errorResponse('Erreur lors de la création des prises murales.', 500);
        }
    }

    public function updatePriseMurale(Request $request, Equipement $equipement): JsonResponse
    {
        if ($equipement->type !== 'prise_murale') {
            return $this->errorResponse('Cet équipement n\'est pas une prise murale.', 422);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'salle_id' => 'sometimes|exists:salles,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'emplacement' => 'nullable|string|max:255',
            'type_prise' => 'nullable|in:RJ45,Fibre,Coaxial',
            'status' => 'nullable|in:active,inactive,maintenance',
        ]);

        $equipement->update([
            'name' => $request->get('name', $equipement->name),
            'modele' => $request->get('type_prise', $equipement->modele),
            'description' => $request->get('emplacement', $equipement->description),
            'salle_id' => $request->get('salle_id', $equipement->salle_id),
            'batiment_id' => $request->get('batiment_id', $equipement->batiment_id),
            'status' => $request->get('status', $equipement->status),
        ]);

        if ($request->has('name')) {
            $port = $equipement->ports()->first();
            if ($port) {
                $port->update(['device_name' => $request->name]);
            }
        }

        return $this->successResponse(
            $equipement->load(['salle.batiment', 'batiment', 'ports']),
            'Prise murale mise à jour avec succès.'
        );
    }

    public function getPrisesMuralesStats(): JsonResponse
    {
        return $this->successResponse($this->equipementService->getPrisesMuralesStats());
    }
}
