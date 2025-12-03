import React from 'react';

interface ViewCounterProps {
  count: number;
}

/**
 * Componente que muestra de forma discreta la cantidad de posts vistos por el usuario
 * Se muestra en el Header como un indicador sutil de progreso
 */
const ViewCounter: React.FC<ViewCounterProps> = ({ count }) => {
  // No mostrar el contador si no hay posts vistos
  if (count === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200"
      title={`Has visto ${count} ${count === 1 ? 'post' : 'posts'} hoy`}
      aria-label={`${count} posts vistos hoy`}
    >
      <svg
        className="w-3.5 h-3.5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span className="font-medium tabular-nums">
        {count}
      </span>
    </div>
  );
};

export default ViewCounter;
