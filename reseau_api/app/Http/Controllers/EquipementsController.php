<?php

namespace App\Http\Controllers;

use App\Models\Equipement;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class EquipementsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Equipement::query();

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

        $equipements = $query->with('coffret.batiment', 'coffret.salle', 'batiment', 'salle', 'ports')->orderBy('name')->paginate($perPage);

        // Générer les QR codes manquants
        foreach ($equipements->items() as $equipement) {
            if (!$equipement->qr_code) {
                $qrCode = $this->generateQRCode($equipement);
                $equipement->update(['qr_code' => $qrCode]);
                $equipement->refresh();
            }
        }

        return response()->json($equipements);
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
            'equipement_code' => 'nullable|string|max:255|unique:equipements,equipement_code',
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'modele' => 'nullable|string|max:255',
            'fabricant' => 'nullable|string|max:255',
            'numero_serie' => 'nullable|string|max:255',
            'type_reseau' => 'nullable|in:IT,OT',
            'nb_ports_fibre' => 'nullable|integer|min:0',
            'nb_ports_rj45' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'coffret_id' => 'required|exists:coffrets,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        // Générer automatiquement le code équipement s'il n'est pas fourni
        $equipementCode = $request->equipement_code;
        if (empty($equipementCode)) {
            $equipementCode = $this->generateEquipementCode();
        }

        $equipementData = $request->all();
        $equipementData['equipement_code'] = $equipementCode;

        $equipement = Equipement::create($equipementData);

        // Générer et stocker le QR code
        $qrCode = $this->generateQRCode($equipement);
        $equipement->update(['qr_code' => $qrCode]);
        $equipement->refresh();

        return response()->json([
            'message' => 'Équipement créé avec succès.',
            'data' => $equipement,
        ], 201);
    }

    /**
     * Génère un code équipement unique au format EQ-001, EQ-002, etc.
     */
    private function generateEquipementCode(): string
    {
        // Récupérer tous les équipements avec un code au format EQ-XXX
        $equipements = Equipement::where('equipement_code', 'like', 'EQ-%')
            ->get();

        $maxNumber = 0;
        
        foreach ($equipements as $equipement) {
            // Extraire le numéro du code (après "EQ-")
            $code = $equipement->equipement_code;
            if (preg_match('/^EQ-(\d+)$/', $code, $matches)) {
                $number = (int) $matches[1];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        }

        // Incrémenter pour obtenir le prochain numéro
        $newNumber = $maxNumber + 1;

        // Formater avec des zéros à gauche (EQ-001, EQ-002, etc.)
        return 'EQ-' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Génère un QR code pour un équipement
     */
    private function generateQRCode(Equipement $equipement): string
    {
        // Créer les données à encoder dans le QR code
        $qrData = json_encode([
            'id' => $equipement->id,
            'code' => $equipement->equipement_code,
            'nom' => $equipement->name,
            'type' => 'equipement'
        ]);

        // Générer le QR code en format SVG (string)
        $qrCode = QrCode::size(300)
            ->format('svg')
            ->generate($qrData);

        return $qrCode;
    }

    /**
     * Display the specified resource.
     */
    public function show(Equipement $equipement)
    {
        // Générer le QR code s'il n'existe pas
        if (!$equipement->qr_code) {
            $qrCode = $this->generateQRCode($equipement);
            $equipement->update(['qr_code' => $qrCode]);
            $equipement->refresh();
        }

        return response()->json([
            'data' => $equipement->load('coffret.batiment', 'coffret.salle', 'batiment', 'salle', 'ports')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Equipement $equipement)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        $request->validate([
            'equipement_code' => 'sometimes|string|max:255|unique:equipements,equipement_code,' . $equipement->id,
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'modele' => 'sometimes|string|max:255|nullable',
            'fabricant' => 'sometimes|string|max:255|nullable',
            'numero_serie' => 'sometimes|string|max:255|nullable',
            'type_reseau' => 'sometimes|in:IT,OT|nullable',
            'nb_ports_fibre' => 'sometimes|integer|min:0|nullable',
            'nb_ports_rj45' => 'sometimes|integer|min:0|nullable',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'coffret_id' => 'sometimes|exists:coffrets,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        $equipement->update($request->all());

        // Régénérer le QR code si le code ou le nom a changé
        if ($request->has('equipement_code') || $request->has('name')) {
            $qrCode = $this->generateQRCode($equipement);
            $equipement->update(['qr_code' => $qrCode]);
            $equipement->refresh();
        }

        return response()->json([
            'message' => 'Équipement mis à jour avec succès.',
            'data' => $equipement,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Equipement $equipement)
    {
        $equipement->delete();

        return response()->json([
            'message' => 'Équipement supprimé avec succès.',
        ], 200);
    }
}
