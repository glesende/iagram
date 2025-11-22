<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Follow extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'i_anfluencer_id'
    ];

    /**
     * Get the user who is following
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the IAnfluencer being followed
     */
    public function iAnfluencer()
    {
        return $this->belongsTo(IAnfluencer::class, 'i_anfluencer_id');
    }

    /**
     * Check if a user is following an IAnfluencer
     */
    public static function isFollowing($userId, $iAnfluencerId)
    {
        return static::where('user_id', $userId)
            ->where('i_anfluencer_id', $iAnfluencerId)
            ->exists();
    }
}
