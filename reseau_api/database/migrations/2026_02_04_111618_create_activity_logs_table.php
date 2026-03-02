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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action'); // create, update, delete, login, logout, etc.
            $table->string('model_type')->nullable(); // Type de modèle (Equipement, Port, etc.)
            $table->unsignedBigInteger('model_id')->nullable(); // ID du modèle affecté
            $table->text('description'); // Description de l'action
            $table->json('old_values')->nullable(); // Anciennes valeurs (pour update)
            $table->json('new_values')->nullable(); // Nouvelles valeurs (pour create/update)
            $table->string('ip_address', 45)->nullable(); // Adresse IP de l'utilisateur
            $table->text('user_agent')->nullable(); // User agent du navigateur
            $table->timestamps();

            // Index pour améliorer les performances
            $table->index(['user_id', 'created_at']);
            $table->index(['model_type', 'model_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
