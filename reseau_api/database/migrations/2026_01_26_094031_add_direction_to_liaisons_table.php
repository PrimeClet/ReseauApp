<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute la direction UP/DOWN aux liaisons pour tracer le flux réseau.
     *
     * UP (Upstream) = La liaison va vers la source du réseau (vers le routeur/switch principal)
     * DOWN (Downstream) = La liaison va vers la distribution (vers les équipements terminaux)
     *
     * Concept clé du document de briefing ReseauApp :
     * - Permet de reconstituer la chaîne de dépendance
     * - Identifier les impacts avant intervention
     */
    public function up(): void
    {
        Schema::table('liaisons', function (Blueprint $table) {
            // Direction du flux réseau : up (vers source) ou down (vers distribution)
            $table->enum('direction', ['up', 'down'])->default('down')->after('to');

            // Description optionnelle de la liaison
            $table->text('description')->nullable()->after('media');

            // Type de câble plus détaillé
            $table->string('cable_type')->nullable()->after('media');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('liaisons', function (Blueprint $table) {
            $table->dropColumn(['direction', 'description', 'cable_type']);
        });
    }
};
