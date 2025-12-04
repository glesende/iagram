import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import logger from '../utils/logger';

interface EmailVerificationBannerProps {
  authUser: any;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ authUser }) => {
  const [isVerified, setIsVerified] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const status = await apiService.checkVerificationStatus();
        setIsVerified(status.email_verified);

        // Track unverified status in Google Analytics
        if (!status.email_verified && typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'email_verification_banner_shown', {
            event_category: 'Authentication',
          });
        }
      } catch (error) {
        logger.error('Error checking verification status:', error);
      }
    };

    if (authUser) {
      checkVerification();
    }
  }, [authUser]);

  const handleResend = async () => {
    try {
      setIsResending(true);
      setResendMessage('');

      await apiService.resendVerificationEmail();

      setResendMessage('¡Email enviado! Revisa tu bandeja de entrada.');

      // Track resend in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_verification_resent_from_banner', {
          event_category: 'Authentication',
        });
      }

      logger.log('Verification email resent from banner');
    } catch (error) {
      setResendMessage('Error al enviar el email. Intenta de nuevo.');
      logger.error('Error resending verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);

    // Track dismiss in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'email_verification_banner_dismissed', {
        event_category: 'Authentication',
      });
    }
  };

  // Don't show banner if user is verified, if dismissed, or if no auth user
  if (isVerified || isDismissed || !authUser) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Icon and message */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {resendMessage || '¡Verifica tu email para desbloquear todas las funciones!'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!resendMessage && (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="bg-white text-blue-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Enviando...' : 'Reenviar email'}
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="text-white hover:text-blue-100 transition-colors p-1"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
