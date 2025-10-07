export const lightColors = {
  primary: '#4A5D3F',       // Deep moss - main brand color
  primaryLight: '#7A8E6B',  // Muted forest - lighter primary
  primaryDark: '#3A4A32',   // Darker moss for emphasis
  secondary: '#A8BC94',     // Soft sage - secondary actions
  secondaryLight: '#B8CCA0', // Pale mint - light secondary
  accent: '#95A67D',        // Dusty green - accent elements
  background: '#F7F6F0',    // Cream silk - main background
  surface: '#FFFFFF',       // Pure white for cards/surfaces
  surfaceVariant: '#F0EFE8', // Slightly darker cream
  text: '#2A3326',          // Dark green-tinted text
  textSecondary: '#5A6B52', // Muted green-gray text
  textLight: '#8B9A82',     // Light green-gray text
  border: '#D4C5A1',        // Warm taupe - borders and dividers
  error: '#C65D4F',         // Muted red that complements the palette
  success: '#7A8E6B',       // Muted forest for success states
  warning: '#B8A172',       // Warm gold for warnings
  info: '#4A5D3F',          // Deep moss for info

  // Gradients using the new palette
  primaryGradient: ['#4A5D3F', '#7A8E6B'],     // Deep moss to muted forest
  secondaryGradient: ['#A8BC94', '#B8CCA0'],   // Soft sage to pale mint
  accentGradient: ['#95A67D', '#A8BC94'],      // Dusty green to soft sage
} as const;

export const darkColors = {
  primary: '#7A8E6B',       // Muted forest - softer for dark mode
  primaryLight: '#95A67D',  // Dusty green - lighter for dark mode
  primaryDark: '#4A5D3F',   // Deep moss - darker accent
  secondary: '#B8CCA0',     // Pale mint - gentle secondary
  secondaryLight: '#D4E6C7', // Very light mint
  accent: '#A8BC94',        // Soft sage - accent elements
  background: '#1A1F17',    // Very dark moss-tinted background
  surface: '#242B20',       // Dark surface with green tint
  surfaceVariant: '#2F362A', // Slightly lighter dark surface
  text: '#E8E6E0',          // Warm off-white text
  textSecondary: '#C4C2B8', // Muted light text
  textLight: '#A8A59B',     // Dimmer light text
  border: '#3A4035',        // Dark border with green tint
  error: '#E07A6F',         // Softer red for dark mode
  success: '#7A8E6B',       // Muted forest for success
  warning: '#D4B896',       // Warm light taupe for warnings
  info: '#7A8E6B',          // Muted forest for info

  // Dark mode gradients
  primaryGradient: ['#4A5D3F', '#7A8E6B'],     // Deep moss to muted forest
  secondaryGradient: ['#95A67D', '#B8CCA0'],   // Dusty green to pale mint
  accentGradient: ['#7A8E6B', '#A8BC94'],      // Muted forest to soft sage
} as const;

// Default export for backward compatibility
export const Colors = lightColors;