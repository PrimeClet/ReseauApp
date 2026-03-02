<?php

namespace App\Http\Controllers;

use App\Helpers\NotificationHelper;
use App\Http\Requests\Modification\StoreModificationRequest;
use App\Models\Coffret;
use App\Models\Modification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

class ModificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Modification::with(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);

        if ($request->has('type_modification')) {
            $query->where('type_modification', $request->type_modification);
        }
        if ($request->has('coffret_id')) {
            $query->where('coffret_id', $request->coffret_id);
        }
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('raison', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $modifications = $query->orderBy('date_intervention', 'desc')
            ->orderBy('heure_intervention', 'desc')
            ->paginate($perPage);

        return $this->paginatedResponse($modifications);
    }

    public function store(StoreModificationRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['heure_intervention']) && strlen($data['heure_intervention']) > 5) {
            $data['heure_intervention'] = substr($data['heure_intervention'], 0, 5);
        }

        $pendingModification = Modification::where('coffret_id', $data['coffret_id'])
            ->where('statut', 'en_attente')
            ->first();

        if ($pendingModification) {
            return $this->errorResponse(
                'Une demande de modification est déjà en attente de validation pour ce coffret.',
                422
            );
        }

        $data['user_id'] = auth()->id();
        $data['statut'] = 'en_attente';

        $modification = Modification::create($data);

        if ($request->hasFile('photo_avant')) {
            $path = $request->file('photo_avant')->store('modifications/'.$modification->id, 'public');
            $modification->update(['photo_avant' => $path]);
        }
        if ($request->hasFile('photo_apres')) {
            $path = $request->file('photo_apres')->store('modifications/'.$modification->id, 'public');
            $modification->update(['photo_apres' => $path]);
        }

        $modification->refresh();
        $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);

        NotificationHelper::notifyNewModificationRequest($modification);

        return $this->successResponse($modification, 'Modification créée avec succès.', 201);
    }

    public function show(Modification $modification): JsonResponse
    {
        return $this->successResponse(
            $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy'])
        );
    }

    public function update(Request $request, Modification $modification): JsonResponse
    {
        $request->validate([
            'coffret_id' => 'sometimes|exists:coffrets,id',
            'port_id' => 'nullable|exists:ports,id',
            'equipement_id' => 'nullable|exists:equipements,id',
            'type_modification' => 'sometimes|in:ajout_port,ajout_equipement,modification_connexion,suppression_port,suppression_equipement,changement_statut_port',
            'description' => 'sometimes|string',
            'raison' => 'sometimes|string',
            'photo_avant' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'photo_apres' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'date_intervention' => 'sometimes|date',
            'heure_intervention' => 'sometimes|date_format:H:i',
        ]);

        $modification->update($request->only([
            'coffret_id', 'port_id', 'equipement_id', 'type_modification',
            'description', 'raison', 'date_intervention', 'heure_intervention',
        ]));

        if ($request->has('heure_intervention') && strlen($request->heure_intervention) > 5) {
            $modification->update(['heure_intervention' => substr($request->heure_intervention, 0, 5)]);
        }

        if ($request->hasFile('photo_avant')) {
            if ($modification->photo_avant) {
                Storage::disk('public')->delete($modification->photo_avant);
            }
            $path = $request->file('photo_avant')->store('modifications/'.$modification->id, 'public');
            $modification->update(['photo_avant' => $path]);
        }
        if ($request->hasFile('photo_apres')) {
            if ($modification->photo_apres) {
                Storage::disk('public')->delete($modification->photo_apres);
            }
            $path = $request->file('photo_apres')->store('modifications/'.$modification->id, 'public');
            $modification->update(['photo_apres' => $path]);
        }

        $modification->refresh();

        return $this->successResponse(
            $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']),
            'Modification mise à jour avec succès.'
        );
    }

    public function destroy(Modification $modification): JsonResponse
    {
        if ($modification->photo_avant) {
            Storage::disk('public')->delete($modification->photo_avant);
        }
        if ($modification->photo_apres) {
            Storage::disk('public')->delete($modification->photo_apres);
        }

        $directory = 'modifications/'.$modification->id;
        if (Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->deleteDirectory($directory);
        }

        $modification->delete();

        return $this->successResponse(message: 'Modification supprimée avec succès.');
    }

    public function photoAvant(Modification $modification)
    {
        if (! $modification->photo_avant) {
            return $this->errorResponse('Photo avant non trouvée', 404);
        }

        $path = storage_path('app/public/'.$modification->photo_avant);
        if (! file_exists($path)) {
            return $this->errorResponse('Fichier image non trouvé', 404);
        }

        return response()->file($path, [
            'Content-Type' => mime_content_type($path) ?: 'image/jpeg',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    public function photoApres(Modification $modification)
    {
        if (! $modification->photo_apres) {
            return $this->errorResponse('Photo après non trouvée', 404);
        }

        $path = storage_path('app/public/'.$modification->photo_apres);
        if (! file_exists($path)) {
            return $this->errorResponse('Fichier image non trouvé', 404);
        }

        return response()->file($path, [
            'Content-Type' => mime_content_type($path) ?: 'image/jpeg',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    public function approve(Request $request, Modification $modification): JsonResponse
    {
        $request->validate(['commentaire_validation' => 'nullable|string']);

        $modification->update([
            'statut' => 'approuvee',
            'commentaire_validation' => $request->commentaire_validation,
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);
        NotificationHelper::notifyModificationApproved($modification);

        return $this->successResponse($modification, 'Demande de modification approuvée avec succès.');
    }

    public function reject(Request $request, Modification $modification): JsonResponse
    {
        $request->validate([
            'commentaire_validation' => 'required|string|min:10',
        ], [
            'commentaire_validation.required' => 'Un commentaire est requis pour rejeter une demande.',
            'commentaire_validation.min' => 'Le commentaire doit contenir au moins 10 caractères.',
        ]);

        $modification->update([
            'statut' => 'rejetee',
            'commentaire_validation' => $request->commentaire_validation,
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);
        NotificationHelper::notifyModificationRejected($modification);

        return $this->successResponse($modification, 'Demande de modification rejetée.');
    }

    public function requestMoreInfo(Request $request, Modification $modification): JsonResponse
    {
        $request->validate([
            'commentaire_validation' => 'required|string|min:10',
        ], [
            'commentaire_validation.required' => 'Un commentaire est requis.',
            'commentaire_validation.min' => 'Le commentaire doit contenir au moins 10 caractères.',
        ]);

        $modification->update([
            'statut' => 'en_revision',
            'commentaire_validation' => $request->commentaire_validation,
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);
        NotificationHelper::notifyModificationReviewRequest($modification);

        return $this->successResponse($modification, 'Demande mise en révision.');
    }

    public function pending(): JsonResponse
    {
        $modifications = Modification::with(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy'])
            ->where('statut', 'en_attente')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse($modifications);
    }

    public function history($coffretId, Request $request): JsonResponse
    {
        $coffret = Coffret::findOrFail($coffretId);

        $query = Modification::with(['user', 'validatedBy', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement'])
            ->where('coffret_id', $coffretId)
            ->where('statut', 'approuvee')
            ->orderBy('validated_at', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->has('type_modification')) {
            $query->where('type_modification', $request->type_modification);
        }
        if ($request->has('date_from')) {
            $query->whereDate('validated_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('validated_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 50);

        return $this->successResponse([
            'coffret' => ['id' => $coffret->id, 'code' => $coffret->code, 'nom' => $coffret->nom],
            'modifications' => $query->paginate($perPage),
        ]);
    }

    public function exportHistoryCsv($coffretId, Request $request)
    {
        $coffret = Coffret::with(['site', 'zone', 'batiment', 'salle'])->findOrFail($coffretId);

        $query = Modification::with(['user', 'validatedBy', 'port', 'equipement'])
            ->where('coffret_id', $coffretId)
            ->where('statut', 'approuvee')
            ->orderBy('validated_at', 'desc');

        if ($request->has('type_modification')) {
            $query->where('type_modification', $request->type_modification);
        }
        if ($request->has('date_from')) {
            $query->whereDate('validated_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('validated_at', '<=', $request->date_to);
        }

        $modifications = $query->get();

        $typeLabels = [
            'ajout_port' => "Ajout d'un port",
            'ajout_equipement' => "Ajout d'un équipement",
            'modification_connexion' => "Modification d'une connexion",
            'suppression_port' => "Suppression d'un port",
            'suppression_equipement' => "Suppression d'un équipement",
            'changement_statut_port' => "Changement de statut d'un port",
        ];

        $csvLines = ['HISTORIQUE DES MODIFICATIONS - COFFRET', "Code: {$coffret->code}", "Nom: {$coffret->nom}"];
        if ($coffret->site) {
            $csvLines[] = "Site: {$coffret->site->libelle}";
        }
        if ($coffret->batiment) {
            $csvLines[] = "Bâtiment: {$coffret->batiment->nom}";
        }
        if ($coffret->salle) {
            $csvLines[] = "Salle: {$coffret->salle->nom}";
        }
        $csvLines[] = "Date d'export: ".now()->format('d/m/Y H:i:s');
        $csvLines[] = '';
        $csvLines[] = implode(';', ['ID', 'Date Validation', 'Type', 'Description', 'Raison', 'Demandeur', 'Validateur', 'Date intervention', 'Heure', 'Port', 'Équipement', 'Commentaire']);

        foreach ($modifications as $mod) {
            $userName = $mod->user ? ($mod->user->name.' '.($mod->user->surname ?? '')) : "#{$mod->user_id}";
            $validatorName = $mod->validatedBy ? ($mod->validatedBy->name.' '.($mod->validatedBy->surname ?? '')) : 'N/A';
            $clean = fn ($s) => str_replace(["\r", "\n", ';'], ' ', $s ?? '');

            $csvLines[] = implode(';', [
                $mod->id,
                $mod->validated_at ? Carbon::parse($mod->validated_at)->format('d/m/Y H:i:s') : '',
                $typeLabels[$mod->type_modification] ?? $mod->type_modification,
                $clean($mod->description), $clean($mod->raison),
                $userName, $validatorName,
                $mod->date_intervention ? Carbon::parse($mod->date_intervention)->format('d/m/Y') : '',
                $mod->heure_intervention ?? '',
                $mod->port?->port_label ?? '', $mod->equipement?->name ?? '',
                $clean($mod->commentaire_validation),
            ]);
        }

        $filename = "historique_coffret_{$coffret->code}_".date('Y-m-d_His').'.csv';

        return Response::make("\xEF\xBB\xBF".implode("\n", $csvLines), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportHistoryPdf($coffretId, Request $request): JsonResponse
    {
        $coffret = Coffret::with(['site', 'zone', 'batiment', 'salle'])->findOrFail($coffretId);

        $query = Modification::with(['user', 'validatedBy', 'port', 'equipement'])
            ->where('coffret_id', $coffretId)
            ->where('statut', 'approuvee')
            ->orderBy('validated_at', 'desc');

        if ($request->has('type_modification')) {
            $query->where('type_modification', $request->type_modification);
        }
        if ($request->has('date_from')) {
            $query->whereDate('validated_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('validated_at', '<=', $request->date_to);
        }

        $typeLabels = [
            'ajout_port' => "Ajout d'un port",
            'ajout_equipement' => "Ajout d'un équipement",
            'modification_connexion' => "Modification d'une connexion",
            'suppression_port' => "Suppression d'un port",
            'suppression_equipement' => "Suppression d'un équipement",
            'changement_statut_port' => "Changement de statut d'un port",
        ];

        return $this->successResponse([
            'coffret' => [
                'id' => $coffret->id, 'code' => $coffret->code, 'nom' => $coffret->nom,
                'site' => $coffret->site?->libelle, 'zone' => $coffret->zone?->libelle,
                'batiment' => $coffret->batiment?->nom, 'salle' => $coffret->salle?->nom,
            ],
            'modifications' => $query->get()->map(fn ($mod) => [
                'id' => $mod->id,
                'date_validation' => $mod->validated_at,
                'type_label' => $typeLabels[$mod->type_modification] ?? $mod->type_modification,
                'description' => $mod->description,
                'raison' => $mod->raison,
                'user' => $mod->user ? trim($mod->user->name.' '.($mod->user->surname ?? '')) : 'N/A',
                'validator' => $mod->validatedBy ? trim($mod->validatedBy->name.' '.($mod->validatedBy->surname ?? '')) : 'N/A',
                'date_intervention' => $mod->date_intervention,
                'port' => $mod->port?->port_label,
                'equipement' => $mod->equipement?->name,
            ])->toArray(),
            'export_date' => now()->toISOString(),
        ]);
    }

    public function rollback(Request $request, Modification $modification): JsonResponse
    {
        if ($modification->statut !== 'approuvee') {
            return $this->errorResponse('Seules les modifications approuvées peuvent être annulées.', 422);
        }

        $request->validate(['raison' => 'required|string|min:10']);

        $inverseTypes = [
            'ajout_port' => 'suppression_port', 'ajout_equipement' => 'suppression_equipement',
            'suppression_port' => 'ajout_port', 'suppression_equipement' => 'ajout_equipement',
            'modification_connexion' => 'modification_connexion', 'changement_statut_port' => 'changement_statut_port',
        ];

        $rollback = Modification::create([
            'user_id' => auth()->id(),
            'coffret_id' => $modification->coffret_id,
            'port_id' => $modification->port_id,
            'equipement_id' => $modification->equipement_id,
            'type_modification' => $inverseTypes[$modification->type_modification] ?? $modification->type_modification,
            'description' => "Rollback de la modification #{$modification->id}: ".$modification->description,
            'raison' => $request->raison." (Rollback #{$modification->id})",
            'date_intervention' => now()->format('Y-m-d'),
            'heure_intervention' => now()->format('H:i'),
            'statut' => 'approuvee',
            'commentaire_validation' => "Rollback automatique #{$modification->id}",
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        $modification->update([
            'commentaire_validation' => ($modification->commentaire_validation ?? '').
                "\n\n[ROLLBACK] ".now()->format('d/m/Y H:i').' par '.auth()->user()->name." -> #{$rollback->id}",
        ]);

        $rollback->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);
        NotificationHelper::notifyNewModificationRequest($rollback);

        return $this->successResponse($rollback, 'Rollback effectué avec succès.', 201);
    }
}
