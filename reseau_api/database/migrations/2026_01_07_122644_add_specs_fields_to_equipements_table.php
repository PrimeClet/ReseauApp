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
            $table->string('modele')->nullable()->after('type');
            $table->string('fabricant')->nullable()->after('modele');
            $table->string('numero_serie')->nullable()->after('fabricant');
            $table->enum('type_reseau', ['IT', 'OT'])->default('IT')->after('numero_serie');
            $table->unsignedInteger('nb_ports_fibre')->default(0)->after('type_reseau');
            $table->unsignedInteger('nb_ports_rj45')->default(0)->after('nb_ports_fibre');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            $table->dropColumn(['modele', 'fabricant', 'numero_serie', 'type_reseau', 'nb_ports_fibre', 'nb_ports_rj45']);
        });
    }
};
