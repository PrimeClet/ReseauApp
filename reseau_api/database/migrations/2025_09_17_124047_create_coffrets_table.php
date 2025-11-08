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
        Schema::create('coffrets', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string('name');
            $table->string('piece');
            $table->float('long')->nullable();
            $table->float('lat')->nullable();
            $table->string('status');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coffrets');
    }
};
