<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute l'adresse MAC aux équipements.
     *
     * L'adresse MAC est un identifiant unique de l'interface réseau,
     * essentiel pour le mapping réseau et le diagnostic.
     */
    public function up(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            // Adresse MAC de l'équipement (format: AA:BB:CC:DD:EE:FF)
            $table->string('mac_address', 17)->nullable()->after('ip_address');

            // Indicateur si c'est le switch principal de la baie
            $table->boolean('is_principal')->default(false)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            $table->dropColumn(['mac_address', 'is_principal']);
        });
    }
};
