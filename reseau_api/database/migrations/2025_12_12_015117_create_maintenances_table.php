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
        if (!Schema::hasTable('maintenances')) {
            Schema::create('maintenances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('equipement_id')->nullable()->constrained('equipements')->onDelete('set null');
                $table->string('type'); // Type de maintenance
                $table->date('date_debut');
                $table->time('heure_debut');
                $table->string('duree'); // Durée estimée
                $table->string('technicien');
                $table->enum('priorite', ['basse', 'moyenne', 'haute', 'critique'])->default('moyenne');
                $table->text('description');
                $table->enum('statut', ['planifiee', 'en_cours', 'terminee', 'annulee'])->default('planifiee');
                $table->timestamps();
            });
        } else {
            // Table existe déjà, vérifier et ajouter les colonnes manquantes
            Schema::table('maintenances', function (Blueprint $table) {
                if (!Schema::hasColumn('maintenances', 'equipement_id')) {
                    $table->foreignId('equipement_id')->nullable()->after('id')->constrained('equipements')->onDelete('set null');
                }
                if (!Schema::hasColumn('maintenances', 'date_debut')) {
                    $table->date('date_debut')->after('equipement_id');
                }
                if (!Schema::hasColumn('maintenances', 'heure_debut')) {
                    $table->time('heure_debut')->after('date_debut');
                }
                if (!Schema::hasColumn('maintenances', 'duree')) {
                    $table->string('duree')->after('heure_debut');
                }
                if (!Schema::hasColumn('maintenances', 'technicien')) {
                    $table->string('technicien')->after('duree');
                }
                if (!Schema::hasColumn('maintenances', 'priorite')) {
                    $table->enum('priorite', ['basse', 'moyenne', 'haute', 'critique'])->default('moyenne')->after('technicien');
                }
                if (!Schema::hasColumn('maintenances', 'description')) {
                    $table->text('description')->after('priorite');
                }
                if (!Schema::hasColumn('maintenances', 'statut')) {
                    $table->enum('statut', ['planifiee', 'en_cours', 'terminee', 'annulee'])->default('planifiee')->after('description');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};
