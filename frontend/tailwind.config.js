/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      /**
       * Design Tokens - IAgram Color System
       *
       * Estos tokens de diseño centralizan todos los colores usados en la aplicación,
       * facilitando la consistencia visual y el mantenimiento futuro.
       *
       * Uso:
       * - En lugar de: bg-purple-600 → Usar: bg-brand-primary
       * - En lugar de: text-gray-500 → Usar: text-text-secondary
       * - En lugar de: border-gray-300 → Usar: border-border-default
       *
       * Beneficios:
       * - Cambiar el brand completo modificando solo estos valores
       * - Consistencia garantizada en toda la aplicación
       * - Base para implementar temas y modo oscuro en el futuro
       * - Mejor accesibilidad al usar colores semánticos
       */
      colors: {
        /**
         * Brand Colors - Colores principales de la identidad visual
         * Actualmente basados en purple-600 y blue-600 de Tailwind
         *
         * Incluye variantes para gradientes:
         * - light: Fondos sutiles y backgrounds (basado en 50)
         * - medium: Elementos secundarios (basado en 100)
         * - DEFAULT: Color principal (basado en 600)
         * - dark: Estados hover y énfasis (basado en 700)
         *
         * Uso en gradientes:
         * - bg-gradient-to-r from-brand-primary to-brand-secondary
         * - hover:from-brand-primary-dark hover:to-brand-secondary-dark
         */
        brand: {
          primary: {
            light: '#faf5ff',      // purple-50 - Para fondos sutiles en gradientes
            medium: '#f3e8ff',     // purple-100 - Para elementos decorativos
            DEFAULT: '#9333ea',    // purple-600 - Color principal del brand
            dark: '#7e22ce',       // purple-700 - Para estados hover
          },
          secondary: {
            light: '#eff6ff',      // blue-50 - Para fondos sutiles en gradientes
            medium: '#dbeafe',     // blue-100 - Para elementos decorativos
            DEFAULT: '#2563eb',    // blue-600 - Color secundario para acentos
            dark: '#1d4ed8',       // blue-700 - Para estados hover
          },
        },

        /**
         * Text Colors - Jerarquía de colores de texto
         * Establecen la jerarquía visual de la tipografía
         */
        text: {
          primary: '#111827',    // gray-900 - Texto principal (títulos, contenido importante)
          secondary: '#6b7280',  // gray-500 - Texto secundario (descripciones, metadata)
          tertiary: '#9ca3af',   // gray-400 - Texto terciario (placeholders, hints)
        },

        /**
         * Border Colors - Colores para bordes y divisores
         * Usados en inputs, cards, divisores y límites visuales
         */
        border: {
          default: '#d1d5db',    // gray-300 - Bordes estándar
          light: '#e5e7eb',      // gray-200 - Bordes sutiles
        },

        /**
         * Error/Validation Colors - Estados de error
         * Para mensajes de validación, alertas de error y estados críticos
         */
        error: {
          text: '#dc2626',       // red-600 - Texto de error
          bg: '#fef2f2',         // red-50 - Fondo de alertas de error
          border: '#fecaca',     // red-200 - Bordes de elementos de error
        },

        /**
         * Success Colors - Estados de éxito
         * Para mensajes de confirmación y estados exitosos
         */
        success: {
          text: '#16a34a',       // green-600 - Texto de éxito
        },

        /**
         * NOTA IMPORTANTE SOBRE GRADIENTES INVERSOS:
         * Algunos componentes usan gradientes inversos (from-blue to-purple).
         * Para esos casos, simplemente invertir el orden:
         * - Normal: from-brand-primary to-brand-secondary (purple → blue)
         * - Inverso: from-brand-secondary to-brand-primary (blue → purple)
         */
      },
    },
  },
  plugins: [],
}