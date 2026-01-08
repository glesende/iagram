<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailLead extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'email',
        'source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'converted_to_user'
    ];

    protected $casts = [
        'converted_to_user' => 'boolean',
        'created_at' => 'datetime'
    ];

    /**
     * Check if an email already exists in leads
     */
    public static function emailExists(string $email): bool
    {
        return static::where('email', $email)->exists();
    }

    /**
     * Mark lead as converted to user
     */
    public function markAsConverted(): bool
    {
        $this->converted_to_user = true;
        return $this->save();
    }
}
