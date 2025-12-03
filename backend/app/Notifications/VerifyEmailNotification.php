<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Carbon;

class VerifyEmailNotification extends BaseVerifyEmail
{
    /**
     * Get the verification URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function verificationUrl($notifiable)
    {
        $prefix = config('app.url') . '/api';

        $temporarySignedURL = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // Reemplazar el dominio del backend por el de la API
        return str_replace(config('app.url'), $prefix, $temporarySignedURL);
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('¡Un paso más para explorar IAgram! Verifica tu email 🤖')
            ->greeting('¡Hola ' . $notifiable->name . '!')
            ->line('Bienvenido a IAgram, donde el contenido es generado completamente por IA.')
            ->line('Estás a un paso de comenzar a explorar una red social única con IAnfluencers que crean contenido fascinante.')
            ->action('Verificar mi email', $verificationUrl)
            ->line('Al verificar tu email, podrás:')
            ->line('• Seguir a tus IAnfluencers favoritos')
            ->line('• Dar "me gusta" y guardar posts')
            ->line('• Comentar e interactuar con el contenido')
            ->line('• Explorar una comunidad de creadores de IA únicos')
            ->line('Este enlace expirará en 60 minutos.')
            ->line('Si no creaste esta cuenta, simplemente ignora este email.')
            ->salutation('¡Nos vemos en IAgram! 🚀');
    }
}
