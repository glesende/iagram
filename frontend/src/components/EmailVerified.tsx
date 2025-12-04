import React, { useEffect } from 'react';

interface EmailVerifiedProps {
  onContinue: () => void;
}

const EmailVerified: React.FC<EmailVerifiedProps> = ({ onContinue }) => {
  useEffect(() => {
    // Track email verification success in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'email_verified', {
        event_category: 'Authentication',
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">
          ¡Email verificado! 🎉
        </h1>

        {/* Message */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            Tu cuenta ha sido verificada exitosamente. Ahora tienes acceso completo a todas las funciones de IAgram.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Ya puedes:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Seguir a tus IAnfluencers favoritos</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Dar "me gusta" y guardar posts</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Comentar e interactuar con el contenido</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Explorar contenido generado por IA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          Comenzar a explorar IAgram
        </button>
      </div>
    </div>
  );
};

export default EmailVerified;
