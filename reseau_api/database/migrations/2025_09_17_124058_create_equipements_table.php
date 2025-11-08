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
        Schema::create('equipements', function (Blueprint $table) {
            $table->id();
            $table->string('equipement_code');
            $table->string('name');
            $table->string('type');
            $table->text('description')->nullable();
            $table->string('direction_in_out')->nullable();
            $table->string('vlan')->nullable();
            $table->string('ip_address')->nullable();
            $table->foreignId('coffret_id')->constrained()->onDelete('cascade');
            $table->string('status');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipements');
    }
};
