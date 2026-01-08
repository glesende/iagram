import React, { useState, useEffect } from 'react';

interface ResetPasswordProps {
  onBack: () => void;
  onGoToForgotPassword?: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onBack, onGoToForgotPassword }) => {
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: ''
  });
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({});

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false
  });

  useEffect(() => {
    // Get token and email from URL query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      setError('Enlace inválido. Por favor, solicita un nuevo enlace de recuperación.');
      setVerifying(false);
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);

    // Verify token validity
    verifyToken(tokenParam, emailParam);
  }, []);

  useEffect(() => {
    // Check password requirements
    const password = formData.password;
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
  }, [formData.password]);

  const verifyToken = async (tokenParam: string, emailParam: string) => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/password/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token: tokenParam, email: emailParam }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTokenValid(true);
      } else {
        setError(data.message || 'Token inválido o expirado.');
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setError('Error al verificar el token. Por favor, intenta de nuevo.');
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password: formData.password,
          password_confirmation: formData.password_confirmation
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          onBack();
        }, 3000);
      } else {
        if (data.errors) {
          setValidationErrors(data.errors);
        } else {
          setError(data.message || 'Error al restablecer la contraseña.');
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Error de conexión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying token
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600">Verificando enlace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid && !verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <button
            onClick={onBack}
            className="mb-6 flex items-center text-gray-600 hover:text-purple-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al login
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Enlace inválido o expirado</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              {onGoToForgotPassword ? (
                <button
                  onClick={onGoToForgotPassword}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Solicitar nuevo enlace
                </button>
              ) : (
                <button
                  onClick={onBack}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Volver al login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Contraseña restablecida</h2>
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión...
              </p>
              <div className="flex justify-center">
                <svg className="animate-spin h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-purple-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Nueva contraseña</h2>
            <p className="text-gray-600">Ingresa tu nueva contraseña segura</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  validationErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tu nueva contraseña"
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password[0]}</p>
              )}

              {/* Password requirements */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">Requisitos de contraseña:</p>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <svg className={`w-4 h-4 mr-2 ${passwordRequirements.minLength ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={passwordRequirements.minLength ? 'text-gray-700' : 'text-gray-500'}>
                      Al menos 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <svg className={`w-4 h-4 mr-2 ${passwordRequirements.hasUpperCase ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={passwordRequirements.hasUpperCase ? 'text-gray-700' : 'text-gray-500'}>
                      Una letra mayúscula
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <svg className={`w-4 h-4 mr-2 ${passwordRequirements.hasLowerCase ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={passwordRequirements.hasLowerCase ? 'text-gray-700' : 'text-gray-500'}>
                      Una letra minúscula
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <svg className={`w-4 h-4 mr-2 ${passwordRequirements.hasNumber ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={passwordRequirements.hasNumber ? 'text-gray-700' : 'text-gray-500'}>
                      Un número
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  validationErrors.password_confirmation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirma tu nueva contraseña"
              />
              {validationErrors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password_confirmation[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Restableciendo...
                </span>
              ) : (
                'Restablecer contraseña'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
