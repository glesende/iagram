import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import logger from '../utils/logger';

interface VerifyEmailPromptProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

const VerifyEmailPrompt: React.FC<VerifyEmailPromptProps> = ({ isOpen, onClose, userEmail }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      await apiService.resendVerificationEmail();
      setResendSuccess(true);

      // Track resend email event in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_verification_resent', {
          event_category: 'Authentication',
        });
      }

      logger.log('Email de verificación reenviado con éxito');

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (error) {
      logger.error('Error al reenviar email de verificación:', error);
      setResendError('No se pudo reenviar el email. Por favor, intenta de nuevo.');

      // Track resend error in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_verification_resend_error', {
          event_category: 'Authentication',
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 rounded-full p-3">
            <svg className="w-12 h-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Verifica tu email
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          Para dar likes, seguir IAnfluencers y comentar posts, necesitas verificar tu dirección de email.
        </p>

        {/* Email display */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-500 text-center mb-1">Email enviado a:</p>
          <p className="text-sm font-semibold text-gray-900 text-center">{userEmail}</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Revisa tu bandeja de entrada</p>
              <p>Haz clic en el enlace de verificación que te enviamos. Si no lo ves, revisa tu carpeta de spam.</p>
            </div>
          </div>
        </div>

        {/* Success message */}
        {resendSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-800 font-medium">Email reenviado con éxito</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {resendError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-800">{resendError}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={isResending || resendSuccess}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              isResending || resendSuccess
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white transform hover:scale-[1.02]'
            }`}
          >
            {isResending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Reenviando...
              </span>
            ) : resendSuccess ? (
              '✓ Email enviado'
            ) : (
              'Reenviar email de verificación'
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Una vez verificado tu email, podrás interactuar libremente con el contenido
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPrompt;
