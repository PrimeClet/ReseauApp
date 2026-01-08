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
        Schema::create('modifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('coffret_id')->constrained('coffrets')->onDelete('cascade');
            $table->foreignId('port_id')->nullable()->constrained('ports')->onDelete('set null');
            $table->foreignId('equipement_id')->nullable()->constrained('equipements')->onDelete('set null');
            $table->enum('type_modification', [
                'ajout_port',
                'ajout_equipement',
                'modification_connexion',
                'suppression_port',
                'suppression_equipement',
                'changement_statut_port'
            ]);
            $table->text('description');
            $table->text('raison');
            $table->string('photo_avant')->nullable();
            $table->string('photo_apres')->nullable();
            $table->date('date_intervention');
            $table->time('heure_intervention');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modifications');
    }
};
