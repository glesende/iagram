import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface FeedPreferencesModalProps {
  onClose: () => void;
  onSave: (preferences: string[]) => void;
}

const AVAILABLE_NICHES = [
  { value: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
  { value: 'fashion', label: 'Moda', emoji: '👗' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'food', label: 'Comida', emoji: '🍕' },
  { value: 'travel', label: 'Viajes', emoji: '✈️' },
  { value: 'technology', label: 'Tecnología', emoji: '💻' }
];

const FeedPreferencesModal: React.FC<FeedPreferencesModalProps> = ({ onClose, onSave }) => {
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const preferences = await apiService.getContentPreferences();
        setSelectedNiches(preferences.preferred_niches || []);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Error al cargar preferencias');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleNicheToggle = (niche: string) => {
    setSelectedNiches(prev => {
      if (prev.includes(niche)) {
        return prev.filter(n => n !== niche);
      } else {
        return [...prev, niche];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiService.updateContentPreferences(selectedNiches);
      onSave(selectedNiches);
      onClose();
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedNiches(AVAILABLE_NICHES.map(n => n.value));
  };

  const handleClearAll = () => {
    setSelectedNiches([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Personalizar Feed</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">
                Selecciona los nichos que te interesan para ver contenido personalizado en tu feed "Para Ti".
              </p>

              {/* Quick actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Seleccionar todo
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                >
                  Limpiar todo
                </button>
              </div>

              {/* Niches grid */}
              <div className="space-y-2">
                {AVAILABLE_NICHES.map((niche) => {
                  const isSelected = selectedNiches.includes(niche.value);
                  return (
                    <button
                      key={niche.value}
                      onClick={() => handleNicheToggle(niche.value)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{niche.emoji}</span>
                        <span className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                          {niche.label}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Info message */}
              {selectedNiches.length === 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Si no seleccionas ningún nicho, verás todo el contenido disponible.
                  </p>
                </div>
              )}

              {selectedNiches.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ {selectedNiches.length} {selectedNiches.length === 1 ? 'nicho seleccionado' : 'nichos seleccionados'}
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Preferencias'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPreferencesModal;
