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
        Schema::table('coffrets', function (Blueprint $table) {
            $table->foreignId('site_id')->nullable()->after('salle_id')->constrained('sites')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->after('site_id')->constrained('zones')->nullOnDelete();
            $table->string('emplacement')->nullable()->after('piece');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coffrets', function (Blueprint $table) {
            $table->dropColumn('emplacement');
            $table->dropConstrainedForeignId('zone_id');
            $table->dropConstrainedForeignId('site_id');
        });
    }
};
