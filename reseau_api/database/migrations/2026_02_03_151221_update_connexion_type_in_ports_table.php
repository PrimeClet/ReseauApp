<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modifier le ENUM pour ajouter 'rj45'
        DB::statement("ALTER TABLE ports MODIFY COLUMN connexion_type ENUM('fibre', 'rj45', 'cuivre') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Retour à l'ancien ENUM (attention: les valeurs 'rj45' existantes seront perdues)
        DB::statement("ALTER TABLE ports MODIFY COLUMN connexion_type ENUM('fibre', 'cuivre') NULL");
    }
};
