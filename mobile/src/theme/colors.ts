/**
 * Paleta de colores oficial de Utqallya.
 * Negro + blanco como base, morado neón como acento — inspirado en
 * Uber/inDrive (funcionalidad) y Tesla/Discord (minimalismo, contraste alto).
 */
export const colors = {
  // Base
  black: '#0B0B0B',
  white: '#FFFFFF',
  gray: '#1E1E1E',

  // Acentos
  accent: '#8B5CF6', // morado neón
  accentAlt: '#A855F7', // púrpura brillante (gradientes, estados hover/active)

  // Superficies (modo oscuro por defecto, coherente con la identidad de marca)
  background: '#0B0B0B',
  surface: '#151515',
  surfaceElevated: '#1E1E1E',
  border: '#2A2A2A',

  // Texto
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#6B6B6F',
  textOnAccent: '#FFFFFF',

  // Estados semánticos
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#38BDF8',

  // Estados de viaje (para badges/mapa)
  tripSearching: '#F59E0B',
  tripActive: '#8B5CF6',
  tripFinished: '#22C55E',
  tripCancelled: '#EF4444',
} as const;

export type ColorToken = keyof typeof colors;
