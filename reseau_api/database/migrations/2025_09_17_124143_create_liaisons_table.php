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
        Schema::create('liaisons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from')->constrained('equipements')->onDelete('cascade');
            $table->foreignId('to')->constrained('equipements')->onDelete('cascade');
            $table->string('label');
            $table->string('media');
            $table->integer('length')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('liaisons');
    }
};
