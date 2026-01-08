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
        Schema::table('modifications', function (Blueprint $table) {
            $table->enum('statut', ['en_attente', 'approuvee', 'rejetee', 'en_revision'])
                ->default('en_attente')
                ->after('heure_intervention');
            $table->text('commentaire_validation')->nullable()->after('statut');
            $table->foreignId('validated_by')->nullable()->after('commentaire_validation')->constrained('users')->onDelete('set null');
            $table->timestamp('validated_at')->nullable()->after('validated_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modifications', function (Blueprint $table) {
            $table->dropForeign(['validated_by']);
            $table->dropColumn(['statut', 'commentaire_validation', 'validated_by', 'validated_at']);
        });
    }
};
