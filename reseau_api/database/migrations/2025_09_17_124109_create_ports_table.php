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
        Schema::create('ports', function (Blueprint $table) {
            $table->id();
            $table->string('port_label');
            $table->string('device_name');
            $table->boolean('poe_enabled')->default(false);
            $table->string('vlan')->nullable();
            $table->string('speed')->nullable();
            $table->foreignId('connected_equipment_id')->constrained('equipements')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ports');
    }
};
