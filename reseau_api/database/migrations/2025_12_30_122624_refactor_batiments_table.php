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
        Schema::table('batiments', function (Blueprint $table) {
            // Supprimer les colonnes inutiles
            $table->dropColumn(['adresse', 'ville', 'code_postal', 'etat']);

            // Ajouter soft delete
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('batiments', function (Blueprint $table) {
            // Restaurer les colonnes
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->string('code_postal', 10)->nullable();
            $table->string('etat')->default('Actif');

            // Supprimer soft delete
            $table->dropSoftDeletes();
        });
    }
};
