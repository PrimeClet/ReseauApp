<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ports', function (Blueprint $table) {
            $table->enum('type_reseau', ['IT', 'OT'])->default('IT')->after('speed');
            $table->enum('statut', ['actif', 'inactif', 'reserve'])->default('actif')->after('type_reseau');
            $table->enum('connexion_type', ['fibre', 'cuivre'])->nullable()->after('statut');
            $table->string('uplink')->nullable()->after('connexion_type');
            $table->string('downlink')->nullable()->after('uplink');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ports', function (Blueprint $table) {
            $table->dropColumn(['type_reseau', 'statut', 'connexion_type', 'uplink', 'downlink']);
        });
    }
};
