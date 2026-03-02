<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute le genre du port (uplink/downlink) pour identifier le rôle du port.
     *
     * - uplink: Port qui connecte vers le cœur du réseau (vers la source)
     * - downlink: Port qui connecte vers la distribution (vers les équipements terminaux)
     *
     * Par défaut, tous les ports sont downlink.
     */
    public function up(): void
    {
        Schema::table('ports', function (Blueprint $table) {
            $table->enum('port_genre', ['uplink', 'downlink'])->default('downlink')->after('connexion_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ports', function (Blueprint $table) {
            $table->dropColumn('port_genre');
        });
    }
};
