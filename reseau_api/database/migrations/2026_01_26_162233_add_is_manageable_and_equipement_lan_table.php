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
        // Ajouter le champ is_manageable aux équipements
        Schema::table('equipements', function (Blueprint $table) {
            $table->boolean('is_manageable')->default(false)->after('is_principal');
        });

        // Créer la table pivot pour la relation many-to-many entre équipements (switchs) et VLANs (lans)
        Schema::create('equipement_lan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipement_id')->constrained('equipements')->onDelete('cascade');
            $table->foreignId('lan_id')->constrained('lans')->onDelete('cascade');
            $table->boolean('is_tagged')->default(true); // VLAN tagged ou untagged
            $table->string('ports')->nullable(); // Ports concernés par ce VLAN (ex: "1-24" ou "1,5,10")
            $table->timestamps();

            // Index unique pour éviter les doublons
            $table->unique(['equipement_id', 'lan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipement_lan');

        Schema::table('equipements', function (Blueprint $table) {
            $table->dropColumn('is_manageable');
        });
    }
};
