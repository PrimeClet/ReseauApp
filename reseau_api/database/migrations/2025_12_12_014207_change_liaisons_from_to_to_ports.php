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
        Schema::table('liaisons', function (Blueprint $table) {
            // Supprimer les anciennes clés étrangères
            $table->dropForeign(['from']);
            $table->dropForeign(['to']);
            
            // Renommer les colonnes pour plus de clarté (optionnel, on peut garder from/to)
            // Modifier les colonnes pour pointer vers ports
            $table->dropColumn('from');
            $table->dropColumn('to');
        });
        
        Schema::table('liaisons', function (Blueprint $table) {
            // Ajouter les nouvelles colonnes pointant vers ports
            $table->foreignId('from')->after('id')->constrained('ports')->onDelete('cascade');
            $table->foreignId('to')->after('from')->constrained('ports')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('liaisons', function (Blueprint $table) {
            // Supprimer les clés étrangères vers ports
            $table->dropForeign(['from']);
            $table->dropForeign(['to']);
            
            // Supprimer les colonnes
            $table->dropColumn('from');
            $table->dropColumn('to');
        });
        
        Schema::table('liaisons', function (Blueprint $table) {
            // Restaurer les colonnes pointant vers equipements
            $table->foreignId('from')->after('id')->constrained('equipements')->onDelete('cascade');
            $table->foreignId('to')->after('from')->constrained('equipements')->onDelete('cascade');
        });
    }
};
