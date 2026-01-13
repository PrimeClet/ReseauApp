<?php

namespace App\Http\Controllers;

use App\Models\Modification;
use App\Models\Coffret;
use App\Helpers\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use Carbon\Carbon;

class ModificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
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

        // S'assurer que user_id est toujours inclus dans chaque modification
        $modifications->getCollection()->transform(function ($modification) {
            // S'assurer que user_id est présent dans les attributs
            if (!isset($modification->attributes['user_id']) && $modification->user) {
                $modification->setAttribute('user_id', $modification->user->id);
            }
            // Si user_id n'existe toujours pas, essayer de le récupérer depuis la relation
            if (!isset($modification->attributes['user_id']) && $modification->relationLoaded('user') && $modification->user) {
                $modification->setAttribute('user_id', $modification->user->id);
            }
            return $modification;
        });

        return response()->json($modifications);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'coffret_id' => 'required|exists:coffrets,id',
            'port_id' => 'nullable|exists:ports,id',
            'equipement_id' => 'nullable|exists:equipements,id',
            'type_modification' => 'required|in:ajout_port,ajout_equipement,modification_connexion,suppression_port,suppression_equipement,changement_statut_port',
            'description' => 'required|string',
            'raison' => 'required|string',
            'photo_avant' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'photo_apres' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'date_intervention' => 'required|date',
            'heure_intervention' => 'required|date_format:H:i',
        ]);

        // Identifier automatiquement l'utilisateur connecté
        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $data = $request->only([
            'coffret_id',
            'port_id',
            'equipement_id',
            'type_modification',
            'description',
            'raison',
            'date_intervention',
            'heure_intervention',
        ]);

        // S'assurer que l'heure est au bon format (H:i)
        if (isset($data['heure_intervention']) && strlen($data['heure_intervention']) > 5) {
            $data['heure_intervention'] = substr($data['heure_intervention'], 0, 5);
        }

        // Vérifier s'il existe déjà une modification en attente pour ce coffret
        $pendingModification = Modification::where('coffret_id', $data['coffret_id'])
            ->where('statut', 'en_attente')
            ->first();

        if ($pendingModification) {
            return response()->json([
                'message' => 'Une demande de modification est déjà en attente de validation pour ce coffret. Veuillez attendre la validation ou le rejet de la demande existante.',
            ], 422);
        }

        // Ajouter l'ID de l'utilisateur et le statut par défaut
        $data['user_id'] = $userId;
        $data['statut'] = 'en_attente';

        // Créer la modification
        $modification = Modification::create($data);

        // Gérer l'upload des photos
        if ($request->hasFile('photo_avant')) {
            $path = $request->file('photo_avant')->store('modifications/' . $modification->id, 'public');
            $modification->update(['photo_avant' => $path]);
        }

        if ($request->hasFile('photo_apres')) {
            $path = $request->file('photo_apres')->store('modifications/' . $modification->id, 'public');
            $modification->update(['photo_apres' => $path]);
        }

        $modification->refresh();
        $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);

        // Notifier les responsables réseau de la nouvelle demande
        NotificationHelper::notifyNewModificationRequest($modification);

        return response()->json([
            'message' => 'Modification créée avec succès.',
            'data' => $modification,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Modification $modification)
    {
        return response()->json([
            'data' => $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy'])
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Modification $modification)
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

        // Mise à jour des champs fournis
        $modification->update($request->only([
            'coffret_id',
            'port_id',
            'equipement_id',
            'type_modification',
            'description',
            'raison',
            'date_intervention',
            'heure_intervention',
        ]));

        // S'assurer que l'heure est au bon format (H:i)
        if ($request->has('heure_intervention') && strlen($request->heure_intervention) > 5) {
            $modification->update(['heure_intervention' => substr($request->heure_intervention, 0, 5)]);
        }

        // Gérer l'upload des nouvelles photos si fournies
        if ($request->hasFile('photo_avant')) {
            // Supprimer l'ancienne photo si elle existe
            if ($modification->photo_avant) {
                Storage::disk('public')->delete($modification->photo_avant);
            }
            $path = $request->file('photo_avant')->store('modifications/' . $modification->id, 'public');
            $modification->update(['photo_avant' => $path]);
        }

        if ($request->hasFile('photo_apres')) {
            // Supprimer l'ancienne photo si elle existe
            if ($modification->photo_apres) {
                Storage::disk('public')->delete($modification->photo_apres);
            }
            $path = $request->file('photo_apres')->store('modifications/' . $modification->id, 'public');
            $modification->update(['photo_apres' => $path]);
        }

        $modification->refresh();

        return response()->json([
            'message' => 'Modification mise à jour avec succès.',
            'data' => $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Modification $modification)
    {
        // Supprimer les photos associées
        if ($modification->photo_avant) {
            Storage::disk('public')->delete($modification->photo_avant);
        }
        if ($modification->photo_apres) {
            Storage::disk('public')->delete($modification->photo_apres);
        }

        // Supprimer le dossier de la modification si vide
        $directory = 'modifications/' . $modification->id;
        if (Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->deleteDirectory($directory);
        }

        $modification->delete();

        return response()->json([
            'message' => 'Modification supprimée avec succès.',
        ], 200);
    }

    /**
     * Retourne l'image avant d'une modification
     */
    public function photoAvant(Modification $modification)
    {
        if (!$modification->photo_avant) {
            return response()->json(['message' => 'Photo avant non trouvée'], 404);
        }

        $path = storage_path('app/public/' . $modification->photo_avant);
        
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier image non trouvé'], 404);
        }

        $mimeType = mime_content_type($path);
        if (!$mimeType) {
            $mimeType = 'image/jpeg';
        }

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    /**
     * Retourne l'image après d'une modification
     */
    public function photoApres(Modification $modification)
    {
        if (!$modification->photo_apres) {
            return response()->json(['message' => 'Photo après non trouvée'], 404);
        }

        $path = storage_path('app/public/' . $modification->photo_apres);
        
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier image non trouvé'], 404);
        }

        $mimeType = mime_content_type($path);
        if (!$mimeType) {
            $mimeType = 'image/jpeg';
        }

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    /**
     * Approuver une demande de modification
     */
    public function approve(Request $request, Modification $modification)
    {
        // Vérifier que l'utilisateur est administrateur
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Seuls les administrateurs peuvent approuver des demandes'], 403);
        }

        $request->validate([
            'commentaire_validation' => 'nullable|string',
        ]);

        $modification->update([
            'statut' => 'approuvee',
            'commentaire_validation' => $request->commentaire_validation,
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);

        // Notifier le demandeur que sa demande a été approuvée
        NotificationHelper::notifyModificationApproved($modification);

        return response()->json([
            'message' => 'Demande de modification approuvée avec succès.',
            'data' => $modification,
        ], 200);
    }

    /**
     * Rejeter une demande de modification
     */
    public function reject(Request $request, Modification $modification)
    {
        // Vérifier que l'utilisateur est administrateur
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Seuls les administrateurs peuvent rejeter des demandes'], 403);
        }

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

        // Notifier le demandeur que sa demande a été rejetée
        NotificationHelper::notifyModificationRejected($modification);

        return response()->json([
            'message' => 'Demande de modification rejetée.',
            'data' => $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']),
        ], 200);
    }

    /**
     * Demander plus d'informations (passer en révision)
     */
    public function requestMoreInfo(Request $request, Modification $modification)
    {
        // Vérifier que l'utilisateur est administrateur
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Seuls les administrateurs peuvent demander plus d\'informations'], 403);
        }

        $request->validate([
            'commentaire_validation' => 'required|string|min:10',
        ], [
            'commentaire_validation.required' => 'Un commentaire est requis pour demander plus d\'informations.',
            'commentaire_validation.min' => 'Le commentaire doit contenir au moins 10 caractères.',
        ]);

        $modification->update([
            'statut' => 'en_revision',
            'commentaire_validation' => $request->commentaire_validation,
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        $modification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);

        // Notifier le demandeur que sa demande nécessite plus d'informations
        NotificationHelper::notifyModificationReviewRequest($modification);

        return response()->json([
            'message' => 'Demande de modification mise en révision. Des informations complémentaires sont requises.',
            'data' => $modification,
        ], 200);
    }

    /**
     * Obtenir les modifications en attente de validation
     */
    public function pending()
    {
        // Vérifier que l'utilisateur est administrateur
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Seuls les administrateurs peuvent accéder aux demandes en attente'], 403);
        }

        $modifications = Modification::with(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy'])
            ->where('statut', 'en_attente')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $modifications,
        ]);
    }

    /**
     * Obtenir l'historique complet des modifications pour un coffret
     */
    public function history($coffretId, Request $request)
    {
        $coffret = Coffret::findOrFail($coffretId);

        $query = Modification::with(['user', 'validatedBy', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement'])
            ->where('coffret_id', $coffretId)
            ->where('statut', 'approuvee') // Seulement les modifications approuvées dans l'historique
            ->orderBy('validated_at', 'desc')
            ->orderBy('created_at', 'desc');

        // Filtrer par type de modification
        if ($request->has('type_modification')) {
            $query->where('type_modification', $request->type_modification);
        }

        // Filtrer par date
        if ($request->has('date_from')) {
            $query->whereDate('validated_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('validated_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 50);
        $modifications = $query->paginate($perPage);

        return response()->json([
            'coffret' => [
                'id' => $coffret->id,
                'code' => $coffret->code,
                'nom' => $coffret->nom,
            ],
            'data' => $modifications,
        ]);
    }

    /**
     * Exporter l'historique d'un coffret en CSV
     */
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

        $csvLines = [];
        
        // En-tête avec informations du coffret
        $csvLines[] = "HISTORIQUE DES MODIFICATIONS - COFFRET";
        $csvLines[] = "Code: {$coffret->code}";
        $csvLines[] = "Nom: {$coffret->nom}";
        if ($coffret->site) {
            $csvLines[] = "Site: {$coffret->site->libelle}";
        }
        if ($coffret->zone) {
            $csvLines[] = "Zone: {$coffret->zone->libelle}";
        }
        if ($coffret->batiment) {
            $csvLines[] = "Bâtiment: {$coffret->batiment->nom}";
            if ($coffret->batiment->ville) {
                $csvLines[] = "Ville: {$coffret->batiment->ville}";
            }
        }
        if ($coffret->salle) {
            $csvLines[] = "Salle: {$coffret->salle->nom}";
        }
        $csvLines[] = "Date d'export: " . now()->format('d/m/Y H:i:s');
        $csvLines[] = "";
        
        // En-têtes du tableau
        $csvLines[] = implode(';', [
            'ID',
            'Date/Heure Validation',
            'Type de modification',
            'Description',
            'Raison',
            'Utilisateur demandeur',
            'Validateur',
            'Date intervention',
            'Heure intervention',
            'Port concerné',
            'Équipement concerné',
            'Commentaire validation'
        ]);

        // Données
        foreach ($modifications as $mod) {
            $userName = $mod->user 
                ? ($mod->user->name . ($mod->user->surname ? ' ' . $mod->user->surname : ''))
                : "Utilisateur #{$mod->user_id}";
            
            $validatorName = $mod->validatedBy 
                ? ($mod->validatedBy->name . ($mod->validatedBy->surname ? ' ' . $mod->validatedBy->surname : ''))
                : ($mod->validated_by ? "Utilisateur #{$mod->validated_by}" : "Non défini");

            $portLabel = $mod->port ? $mod->port->port_label : ($mod->port_id ? "Port #{$mod->port_id}" : "");
            $equipementName = $mod->equipement ? $mod->equipement->name : ($mod->equipement_id ? "Équipement #{$mod->equipement_id}" : "");

            $csvLines[] = implode(';', [
                $mod->id,
                $mod->validated_at ? Carbon::parse($mod->validated_at)->format('d/m/Y H:i:s') : '',
                $typeLabels[$mod->type_modification] ?? $mod->type_modification,
                str_replace(["\r", "\n", ";"], [' ', ' ', ' '], $mod->description),
                str_replace(["\r", "\n", ";"], [' ', ' ', ' '], $mod->raison),
                $userName,
                $validatorName,
                $mod->date_intervention ? Carbon::parse($mod->date_intervention)->format('d/m/Y') : '',
                $mod->heure_intervention ?? '',
                $portLabel,
                $equipementName,
                $mod->commentaire_validation ? str_replace(["\r", "\n", ";"], [' ', ' ', ' '], $mod->commentaire_validation) : ''
            ]);
        }

        $filename = "historique_coffret_{$coffret->code}_" . date('Y-m-d_His') . ".csv";
        
        // Ajouter BOM UTF-8 pour Excel
        $bom = "\xEF\xBB\xBF";
        
        return Response::make($bom . implode("\n", $csvLines), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Exporter l'historique d'un coffret en PDF (retourne les données formatées)
     */
    public function exportHistoryPdf($coffretId, Request $request)
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

        return response()->json([
            'coffret' => [
                'id' => $coffret->id,
                'code' => $coffret->code,
                'nom' => $coffret->nom,
                'site' => $coffret->site?->libelle,
                'zone' => $coffret->zone?->libelle,
                'batiment' => $coffret->batiment?->nom,
                'ville' => $coffret->batiment?->ville,
                'salle' => $coffret->salle?->nom,
            ],
            'modifications' => $modifications->map(function ($mod) use ($typeLabels) {
                return [
                    'id' => $mod->id,
                    'date_validation' => $mod->validated_at,
                    'type_modification' => $mod->type_modification,
                    'type_modification_label' => $typeLabels[$mod->type_modification] ?? $mod->type_modification,
                    'description' => $mod->description,
                    'raison' => $mod->raison,
                    'user' => $mod->user ? ($mod->user->name . ($mod->user->surname ? ' ' . $mod->user->surname : '')) : "Utilisateur #{$mod->user_id}",
                    'validator' => $mod->validatedBy ? ($mod->validatedBy->name . ($mod->validatedBy->surname ? ' ' . $mod->validatedBy->surname : '')) : ($mod->validated_by ? "Utilisateur #{$mod->validated_by}" : "Non défini"),
                    'date_intervention' => $mod->date_intervention,
                    'heure_intervention' => $mod->heure_intervention,
                    'port' => $mod->port ? $mod->port->port_label : ($mod->port_id ? "Port #{$mod->port_id}" : null),
                    'equipement' => $mod->equipement ? $mod->equipement->name : ($mod->equipement_id ? "Équipement #{$mod->equipement_id}" : null),
                    'commentaire_validation' => $mod->commentaire_validation,
                ];
            })->toArray(),
            'export_date' => now()->toISOString(),
        ]);
    }

    /**
     * Rollback - Restaurer un état précédent en créant une modification inverse
     */
    public function rollback(Request $request, Modification $modification)
    {
        // Vérifier que la modification est approuvée
        if ($modification->statut !== 'approuvee') {
            return response()->json([
                'message' => 'Seules les modifications approuvées peuvent être annulées (rollback).',
            ], 422);
        }

        // Vérifier que l'utilisateur a les droits (administrateur ou directeur)
        if (!auth()->user()->isAdministrator() && auth()->user()->role !== 'directeur') {
            return response()->json([
                'message' => 'Vous n\'avez pas les droits pour effectuer un rollback.',
            ], 403);
        }

        $request->validate([
            'raison' => 'required|string|min:10',
        ], [
            'raison.required' => 'Une raison est requise pour effectuer un rollback.',
            'raison.min' => 'La raison doit contenir au moins 10 caractères.',
        ]);

        // Déterminer le type de modification inverse
        $inverseTypes = [
            'ajout_port' => 'suppression_port',
            'ajout_equipement' => 'suppression_equipement',
            'suppression_port' => 'ajout_port',
            'suppression_equipement' => 'ajout_equipement',
            'modification_connexion' => 'modification_connexion',
            'changement_statut_port' => 'changement_statut_port',
        ];

        $inverseType = $inverseTypes[$modification->type_modification] ?? $modification->type_modification;

        // Créer une nouvelle modification pour annuler la précédente
        $rollbackModification = Modification::create([
            'user_id' => auth()->id(),
            'coffret_id' => $modification->coffret_id,
            'port_id' => $modification->port_id,
            'equipement_id' => $modification->equipement_id,
            'type_modification' => $inverseType,
            'description' => "Annulation (rollback) de la modification #{$modification->id}: " . $modification->description,
            'raison' => $request->raison . " (Rollback de la modification #{$modification->id})",
            'date_intervention' => now()->format('Y-m-d'),
            'heure_intervention' => now()->format('H:i'),
            'statut' => 'approuvee', // Approuver automatiquement le rollback
            'commentaire_validation' => "Rollback automatique de la modification #{$modification->id}",
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        // Marquer la modification originale comme "annulée" en ajoutant un commentaire
        $modification->update([
            'commentaire_validation' => ($modification->commentaire_validation ?? '') . "\n\n[ANNULÉ PAR ROLLBACK] Rollback effectué le " . now()->format('d/m/Y H:i') . " par " . auth()->user()->name . ". Nouvelle modification: #{$rollbackModification->id}",
        ]);

        $rollbackModification->load(['user', 'coffret.site', 'coffret.zone', 'coffret.batiment', 'coffret.salle', 'port', 'equipement', 'validatedBy']);

        // Notifier les responsables
        NotificationHelper::notifyNewModificationRequest($rollbackModification);

        return response()->json([
            'message' => 'Rollback effectué avec succès. Une nouvelle modification a été créée pour annuler la modification précédente.',
            'data' => $rollbackModification,
            'original_modification_id' => $modification->id,
        ], 201);
    }
}
