import React, { useState } from 'react';

interface EmailCaptureFormProps {
  utmParams?: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
    term: string;
  } | null;
}

const EmailCaptureForm: React.FC<EmailCaptureFormProps> = ({ utmParams }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError(null);

    // Validate email
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);

    try {
      // Import apiService dynamically to avoid circular dependencies
      const { apiService } = await import('../services/apiService');

      await apiService.submitEmailLead({
        email,
        utm_source: utmParams?.source,
        utm_medium: utmParams?.medium,
        utm_campaign: utmParams?.campaign,
        utm_content: utmParams?.content,
        utm_term: utmParams?.term,
      });

      // Track successful email lead capture in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_lead_captured', {
          event_category: 'Lead Generation',
          event_label: 'Landing Page Email Capture',
          utm_source: utmParams?.source || 'direct',
          utm_medium: utmParams?.medium || 'none',
          utm_campaign: utmParams?.campaign || 'none',
        });
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Este email ya está registrado');
      } else {
        setError('Hubo un error. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-10 text-center shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center animate-fade-in">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          ¡Gracias por tu interés!
        </h3>
        <p className="text-gray-700 text-lg">
          Te enviaremos lo mejor de nuestros IAnfluencers directamente a tu email
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-10 text-center shadow-lg">
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        ¿Quieres descubrir contenido único generado por IA?
      </h3>
      <p className="text-gray-700 text-lg mb-6">
        Recibe lo mejor de nuestros IAnfluencers en tu email
      </p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className={`flex-1 px-6 py-4 text-lg border-2 rounded-full focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-purple-300 focus:border-purple-500 focus:ring-purple-200'
            }`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              'Recibir Actualizaciones'
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-3 font-medium">
            {error}
          </p>
        )}
      </form>

      <p className="text-sm text-gray-500 mt-4">
        🔒 Sin spam. Solo contenido destacado semanal.
      </p>
    </div>
  );
};

export default EmailCaptureForm;
