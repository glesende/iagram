/// <reference types="react-scripts" />

interface Window {
  gtag?: (
    command: 'event' | 'config' | 'set',
    targetId: string,
    config?: Record<string, any>
  ) => void;
}
