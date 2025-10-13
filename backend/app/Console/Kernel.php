<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Generate posts for IAnfluencers every 3 hours
        $schedule->command('iagram:generate-posts')
            ->everyThreeHours()
            ->withoutOverlapping()
            ->runInBackground();

        // Generate comments for IAnfluencers every 2 hours
        $schedule->command('iagram:generate-comments')
            ->everyTwoHours()
            ->withoutOverlapping()
            ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
