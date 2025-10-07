export const fonts = {
  spectral: {
    regular: 'Spectral_400Regular',
    medium: 'Spectral_500Medium',
    semibold: 'Spectral_600SemiBold',
    bold: 'Spectral_700Bold',
  },
  system: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  }
};

export const textStyles = {
  // Headings
  h1: {
    fontFamily: fonts.spectral.bold,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: fonts.spectral.bold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  h3: {
    fontFamily: fonts.spectral.semibold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  h4: {
    fontFamily: fonts.spectral.semibold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h5: {
    fontFamily: fonts.spectral.medium,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  h6: {
    fontFamily: fonts.spectral.medium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
  },

  // Body text
  body1: {
    fontFamily: fonts.spectral.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  body2: {
    fontFamily: fonts.spectral.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },

  // UI text
  button: {
    fontFamily: fonts.spectral.medium,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: fonts.spectral.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  overline: {
    fontFamily: fonts.spectral.medium,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },

  // Navigation
  tabLabel: {
    fontFamily: fonts.spectral.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },

  // Input
  input: {
    fontFamily: fonts.spectral.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  inputLabel: {
    fontFamily: fonts.spectral.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
};
