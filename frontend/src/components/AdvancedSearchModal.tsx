import React, { useState } from 'react';

export interface AdvancedFilters {
  followersRange: 'any' | '1k_10k' | '10k_50k' | '50k_plus';
  postsActivity: 'any' | 'new' | 'active' | 'very_active';
  verified: 'all' | 'verified' | 'not_verified';
  sortBy: 'followers_desc' | 'followers_asc' | 'posts_desc' | 'recent';
}

export const defaultAdvancedFilters: AdvancedFilters = {
  followersRange: 'any',
  postsActivity: 'any',
  verified: 'all',
  sortBy: 'followers_desc',
};

interface AdvancedSearchModalProps {
  isOpen: boolean;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  onClose: () => void;
}

const followersRangeOptions = [
  { value: 'any', label: 'Cualquiera' },
  { value: '1k_10k', label: '1K – 10K seguidores' },
  { value: '10k_50k', label: '10K – 50K seguidores' },
  { value: '50k_plus', label: '50K+ seguidores' },
] as const;

const postsActivityOptions = [
  { value: 'any', label: 'Cualquiera' },
  { value: 'new', label: 'Nuevo (1–20 posts)' },
  { value: 'active', label: 'Activo (20–50 posts)' },
  { value: 'very_active', label: 'Muy activo (50+ posts)' },
] as const;

const verifiedOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'verified', label: 'Verificados' },
  { value: 'not_verified', label: 'No verificados' },
] as const;

const sortByOptions = [
  { value: 'followers_desc', label: 'Más seguidores' },
  { value: 'followers_asc', label: 'Menos seguidores' },
  { value: 'posts_desc', label: 'Más activos (posts)' },
  { value: 'recent', label: 'Nuevos perfiles' },
] as const;

function RadioGroup<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              value === opt.value
                ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-300 hover:border-brand-primary hover:text-brand-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  filters,
  onApply,
  onClose,
}) => {
  const [local, setLocal] = useState<AdvancedFilters>(filters);

  // Sync local state when modal opens with current filters
  React.useEffect(() => {
    if (isOpen) setLocal(filters);
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleClear = () => {
    setLocal(defaultAdvancedFilters);
  };

  const hasChanges =
    local.followersRange !== 'any' ||
    local.postsActivity !== 'any' ||
    local.verified !== 'all' ||
    local.sortBy !== 'followers_desc';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Búsqueda avanzada</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <RadioGroup
            label="Rango de seguidores"
            name="followersRange"
            options={followersRangeOptions}
            value={local.followersRange}
            onChange={(v) => setLocal(prev => ({ ...prev, followersRange: v }))}
          />

          <RadioGroup
            label="Nivel de actividad (posts)"
            name="postsActivity"
            options={postsActivityOptions}
            value={local.postsActivity}
            onChange={(v) => setLocal(prev => ({ ...prev, postsActivity: v }))}
          />

          <RadioGroup
            label="Estado de verificación"
            name="verified"
            options={verifiedOptions}
            value={local.verified}
            onChange={(v) => setLocal(prev => ({ ...prev, verified: v }))}
          />

          <RadioGroup
            label="Ordenar resultados por"
            name="sortBy"
            options={sortByOptions}
            value={local.sortBy}
            onChange={(v) => setLocal(prev => ({ ...prev, sortBy: v }))}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasChanges}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Limpiar filtros
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg hover:from-brand-primary-dark hover:to-brand-secondary-dark transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
