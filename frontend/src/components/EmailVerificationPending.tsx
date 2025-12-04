import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import logger from '../utils/logger';

interface EmailVerificationPendingProps {
  email: string;
  onBack: () => void;
}

const EmailVerificationPending: React.FC<EmailVerificationPendingProps> = ({ email, onBack }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setResendMessage('');
      setResendSuccess(false);

      await apiService.resendVerificationEmail();

      setResendSuccess(true);
      setResendMessage('¡Email reenviado con éxito! Revisa tu bandeja de entrada.');

      // Track resend in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_verification_resent', {
          event_category: 'Authentication',
        });
      }

      logger.log('Verification email resent successfully');
    } catch (error) {
      setResendSuccess(false);
      setResendMessage('Error al reenviar el email. Por favor intenta de nuevo.');
      logger.error('Error resending verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">
          ¡Revisa tu email!
        </h1>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            Hemos enviado un email de verificación a:
          </p>
          <p className="text-lg font-semibold text-blue-600 mb-4">
            {email}
          </p>
          <p className="text-gray-600 text-sm">
            Haz clic en el enlace del email para verificar tu cuenta y desbloquear todas las funciones de IAgram.
          </p>
        </div>

        {/* Features */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Al verificar tu email podrás:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Seguir a tus IAnfluencers favoritos</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Dar "me gusta" y guardar posts</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Comentar e interactuar con el contenido</span>
            </li>
          </ul>
        </div>

        {/* Resend Message */}
        {resendMessage && (
          <div className={`mb-4 p-3 rounded-lg ${resendSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="text-sm text-center">{resendMessage}</p>
          </div>
        )}

        {/* Resend Button */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">
            ¿No recibiste el email?
          </p>
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Reenviando...' : 'Reenviar email de verificación'}
          </button>
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-600 text-center">
            Revisa también tu carpeta de spam o correo no deseado. Si continúas teniendo problemas, contáctanos.
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationPending;
