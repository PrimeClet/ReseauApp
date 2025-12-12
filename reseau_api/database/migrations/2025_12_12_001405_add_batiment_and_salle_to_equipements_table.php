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
        Schema::table('equipements', function (Blueprint $table) {
            $table->foreignId('batiment_id')->nullable()->after('coffret_id')->constrained()->onDelete('set null');
            $table->foreignId('salle_id')->nullable()->after('batiment_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            $table->dropForeign(['batiment_id']);
            $table->dropForeign(['salle_id']);
            $table->dropColumn(['batiment_id', 'salle_id']);
        });
    }
};
