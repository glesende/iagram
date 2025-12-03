import { useState, useEffect, useCallback } from 'react';

interface PostViewData {
  count: number;
  timestamp: number; // Timestamp del último reset
}

const STORAGE_KEY = 'iagram_post_views';
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

/**
 * Hook personalizado para trackear la cantidad de posts vistos por el usuario
 * Persiste el contador en localStorage y lo resetea cada 24 horas
 */
export const usePostViewCounter = () => {
  const [viewCount, setViewCount] = useState<number>(0);

  // Cargar datos iniciales desde localStorage
  useEffect(() => {
    const loadViewData = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          // No hay datos, inicializar
          const initialData: PostViewData = {
            count: 0,
            timestamp: Date.now()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
          setViewCount(0);
          return;
        }

        const data: PostViewData = JSON.parse(stored);
        const now = Date.now();
        const timeSinceLastReset = now - data.timestamp;

        // Verificar si han pasado 24 horas
        if (timeSinceLastReset >= RESET_INTERVAL) {
          // Reset después de 24 horas
          const resetData: PostViewData = {
            count: 0,
            timestamp: now
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
          setViewCount(0);
        } else {
          // Cargar contador existente
          setViewCount(data.count);
        }
      } catch (error) {
        console.error('Error loading post view data:', error);
        setViewCount(0);
      }
    };

    loadViewData();
  }, []);

  // Incrementar el contador cuando se ve un post
  const incrementViewCount = useCallback(() => {
    setViewCount(prevCount => {
      const newCount = prevCount + 1;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data: PostViewData = stored
          ? JSON.parse(stored)
          : { count: 0, timestamp: Date.now() };

        const updatedData: PostViewData = {
          count: newCount,
          timestamp: data.timestamp
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      } catch (error) {
        console.error('Error updating post view count:', error);
      }

      return newCount;
    });
  }, []);

  // Resetear el contador manualmente (útil para testing)
  const resetViewCount = useCallback(() => {
    const resetData: PostViewData = {
      count: 0,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
    setViewCount(0);
  }, []);

  return {
    viewCount,
    incrementViewCount,
    resetViewCount
  };
};
