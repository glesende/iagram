import React, { useEffect } from 'react';

interface RegisterReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  anonymousInteractions: number;
}

const RegisterReminderModal: React.FC<RegisterReminderModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  anonymousInteractions,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRegisterClick = () => {
    // Track register button click from reminder
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'register_from_reminder', {
        anonymous_interactions: anonymousInteractions,
        event_category: 'Conversion',
      });
    }
    onRegister();
  };

  const handleDismiss = () => {
    // Track reminder dismissal
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const reminderShownCount = parseInt(localStorage.getItem('reminder_shown_count') || '0');
      (window as any).gtag('event', 'register_reminder_dismissed', {
        anonymous_interactions: anonymousInteractions,
        dismiss_count: reminderShownCount,
        event_category: 'Conversion',
      });
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-scaleIn">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hero icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-full p-4">
            <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          ¡Te está gustando IAgram!
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-6">
          Regístrate gratis para desbloquear todas las funciones
        </p>

        {/* Benefits list */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700">Guarda tus posts favoritos</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700">Sigue a tus IAnfluencers preferidos</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700">Comenta y participa en conversaciones</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700">Personaliza tu feed por nicho</span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRegisterClick}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            Crear Cuenta Gratis
          </button>
          <button
            onClick={handleDismiss}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors text-sm"
          >
            Seguir explorando sin registrarme
          </button>
        </div>

        {/* Trust signal */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Únete a miles de usuarios explorando el futuro de las redes sociales con IA
        </p>
      </div>
    </div>
  );
};

export default RegisterReminderModal;
