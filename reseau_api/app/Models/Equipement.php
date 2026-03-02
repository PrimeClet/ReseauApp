<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Equipement extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $logLabel = 'Équipement';

    protected $logIdentifier = 'name';

    protected $fillable = [
        'equipement_code',
        'qr_code',
        'name',
        'type',
        'modele',
        'fabricant',
        'numero_serie',
        'type_reseau',
        'description',
        'direction_in_out',
        'vlan',
        'ip_address',
        'mac_address',
        'coffret_id',
        'batiment_id',
        'salle_id',
        'status',
        'is_principal',
        'is_manageable',
        'nombre_ports',
    ];

    protected $casts = [
        'is_principal' => 'boolean',
        'is_manageable' => 'boolean',
    ];

    public function coffret()
    {
        return $this->belongsTo(Coffret::class);
    }

    public function batiment()
    {
        return $this->belongsTo(Batiment::class);
    }

    public function salle()
    {
        return $this->belongsTo(Salle::class);
    }

    public function ports()
    {
        return $this->hasMany(Port::class, 'equipement_id');
    }

    /**
     * Relation avec les VLANs (pour les switchs manageables)
     */
    public function vlans()
    {
        return $this->belongsToMany(Lan::class, 'equipement_lan')
            ->withPivot(['is_tagged', 'ports'])
            ->withTimestamps();
    }

    /**
     * Scope pour les switchs manageables
     */
    public function scopeManageable($query)
    {
        return $query->where('is_manageable', true)->where('type', 'switch');
    }

    /**
     * Vérifie si cet équipement est un switch manageable
     */
    public function isManageableSwitch(): bool
    {
        return $this->is_manageable && strtolower($this->type) === 'switch';
    }

    /**
     * Relation avec les maintenances
     */
    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }

    /**
     * Relation avec les liaisons (via les ports)
     */
    public function liaisons()
    {
        return Liaison::whereIn('from', $this->ports()->pluck('id'))
            ->orWhereIn('to', $this->ports()->pluck('id'));
    }

    // ==========================================
    // CHAÎNE DE DÉPENDANCE UP/DOWN
    // ==========================================

    /**
     * Scope pour les switches principaux
     */
    public function scopePrincipal($query)
    {
        return $query->where('is_principal', true);
    }

    /**
     * Scope pour les équipements de type switch
     */
    public function scopeSwitches($query)
    {
        return $query->where('type', 'switch');
    }

    /**
     * Vérifie si cet équipement est le switch principal de sa baie
     */
    public function isPrincipalSwitch(): bool
    {
        return $this->is_principal && strtolower($this->type) === 'switch';
    }

    /**
     * Récupère les équipements en amont (UP) de cet équipement
     * Suit les liaisons avec direction 'up'
     *
     * @param  int  $maxDepth  Profondeur maximale de traversée
     */
    public function getUpstreamEquipements(int $maxDepth = 10): \Illuminate\Support\Collection
    {
        return $this->traverseDependencyChain('up', $maxDepth);
    }

    /**
     * Récupère les équipements en aval (DOWN) de cet équipement
     * Suit les liaisons avec direction 'down'
     *
     * @param  int  $maxDepth  Profondeur maximale de traversée
     */
    public function getDownstreamEquipements(int $maxDepth = 10): \Illuminate\Support\Collection
    {
        return $this->traverseDependencyChain('down', $maxDepth);
    }

    /**
     * Traverse la chaîne de dépendance dans une direction donnée
     *
     * @param  string  $direction  'up' ou 'down'
     * @param  int  $maxDepth  Profondeur maximale
     * @param  array  $visited  IDs déjà visités (évite les boucles)
     */
    protected function traverseDependencyChain(string $direction, int $maxDepth, array &$visited = []): \Illuminate\Support\Collection
    {
        $results = collect();

        if ($maxDepth <= 0 || in_array($this->id, $visited)) {
            return $results;
        }

        $visited[] = $this->id;
        $portIds = $this->ports()->pluck('id')->toArray();

        if (empty($portIds)) {
            return $results;
        }

        // Pour UP: on cherche les liaisons où nos ports sont la destination (to)
        // Pour DOWN: on cherche les liaisons où nos ports sont la source (from)
        if ($direction === 'up') {
            $liaisons = Liaison::where('direction', 'up')
                ->whereIn('to', $portIds)
                ->with(['fromPort.equipement', 'toPort'])
                ->get();
        } else {
            $liaisons = Liaison::where('direction', 'down')
                ->whereIn('from', $portIds)
                ->with(['toPort.equipement', 'fromPort'])
                ->get();
        }

        foreach ($liaisons as $liaison) {
            $connectedEquipement = $direction === 'up'
                ? $liaison->fromPort?->equipement
                : $liaison->toPort?->equipement;

            if ($connectedEquipement && ! in_array($connectedEquipement->id, $visited)) {
                $results->push([
                    'equipement' => $connectedEquipement,
                    'liaison' => $liaison,
                    'depth' => 11 - $maxDepth,
                ]);

                // Récursion pour continuer la traversée
                $childResults = $connectedEquipement->traverseDependencyChain($direction, $maxDepth - 1, $visited);
                $results = $results->merge($childResults);
            }
        }

        return $results;
    }

    /**
     * Récupère la chaîne de dépendance complète (UP et DOWN)
     *
     * @param  int  $maxDepth  Profondeur maximale dans chaque direction
     */
    public function getFullDependencyChain(int $maxDepth = 10): array
    {
        return [
            'equipement' => $this,
            'upstream' => $this->getUpstreamEquipements($maxDepth),
            'downstream' => $this->getDownstreamEquipements($maxDepth),
        ];
    }

    /**
     * Analyse d'impact : retourne tous les équipements affectés si cet équipement tombe en panne
     */
    public function getImpactedEquipements(): \Illuminate\Support\Collection
    {
        // Si cet équipement tombe, tous les équipements downstream sont impactés
        return $this->getDownstreamEquipements();
    }

    /**
     * Récupère le switch principal de la baie de cet équipement
     */
    public function getPrincipalSwitch(): ?Equipement
    {
        if (! $this->coffret_id) {
            return null;
        }

        return static::where('coffret_id', $this->coffret_id)
            ->where('is_principal', true)
            ->where('type', 'switch')
            ->first();
    }
}
