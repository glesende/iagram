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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['like', 'comment', 'follow', 'mention', 'new_post']);
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Destinatario
            $table->foreignId('actor_id')->nullable()->constrained('users')->onDelete('cascade'); // Quien generó la notificación
            $table->foreignId('post_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('comment_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('i_anfluencer_id')->nullable()->constrained('i_anfluencers')->onDelete('cascade'); // Para notificaciones de follow
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            // Índices para mejorar performance de queries
            $table->index(['user_id', 'is_read', 'created_at']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
