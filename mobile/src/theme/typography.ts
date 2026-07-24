import { colors } from './colors';

/** Tipografía limpia y consistente. Usa la fuente del sistema (rápida, sin fuentes externas que pesen el bundle). */
export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  button: { fontSize: 16, fontWeight: '700' as const, color: colors.textOnAccent },
  code: { fontSize: 40, fontWeight: '800' as const, color: colors.accent, letterSpacing: 6 },
} as const;
