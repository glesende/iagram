import { useEffect, useRef, useState } from 'react';

interface UsePostVisibilityOptions {
  onViewed: () => void;
  threshold?: number; // Percentage of element that must be visible (0-1)
  minViewDuration?: number; // Minimum duration in milliseconds that post must be visible
}

/**
 * Hook que detecta cuando un post es visible en el viewport durante un tiempo mínimo
 * Usa IntersectionObserver para eficiencia y previene re-conteos del mismo post
 *
 * @param onViewed - Callback ejecutado cuando el post se considera "visto"
 * @param threshold - Porcentaje del elemento que debe ser visible (por defecto 0.5 = 50%)
 * @param minViewDuration - Duración mínima en ms que debe ser visible (por defecto 1000ms)
 */
export const usePostVisibility = ({
  onViewed,
  threshold = 0.5,
  minViewDuration = 1000
}: UsePostVisibilityOptions) => {
  const elementRef = useRef<HTMLElement>(null);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasBeenViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // El post entró al viewport
            // Iniciar temporizador para contar como "visto" después del tiempo mínimo
            if (!viewTimerRef.current) {
              viewTimerRef.current = setTimeout(() => {
                if (!hasBeenViewed) {
                  setHasBeenViewed(true);
                  onViewed();
                }
              }, minViewDuration);
            }
          } else {
            // El post salió del viewport antes de cumplir el tiempo mínimo
            if (viewTimerRef.current) {
              clearTimeout(viewTimerRef.current);
              viewTimerRef.current = null;
            }
          }
        });
      },
      {
        threshold,
        // rootMargin: '0px' // Opcional: ajustar el área de detección
      }
    );

    observer.observe(element);

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
      observer.disconnect();
    };
  }, [hasBeenViewed, onViewed, threshold, minViewDuration]);

  return {
    ref: elementRef,
    hasBeenViewed
  };
};
