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
        Schema::create('email_leads', function (Blueprint $table) {
            $table->id();
            $table->string('email', 255)->unique();
            $table->string('source', 50)->default('landing_page');
            $table->string('utm_source', 100)->nullable();
            $table->string('utm_medium', 100)->nullable();
            $table->string('utm_campaign', 100)->nullable();
            $table->string('utm_content', 100)->nullable();
            $table->string('utm_term', 100)->nullable();
            $table->boolean('converted_to_user')->default(false);
            $table->timestamp('created_at')->useCurrent();

            // Indexes for performance
            $table->index('email', 'idx_email_leads_email');
            $table->index('created_at', 'idx_email_leads_created_at');
            $table->index('converted_to_user', 'idx_email_leads_converted');
            $table->index('source', 'idx_email_leads_source');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_leads');
    }
};
