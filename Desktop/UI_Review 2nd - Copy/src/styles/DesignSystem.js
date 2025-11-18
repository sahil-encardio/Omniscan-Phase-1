// NexaWave Omniscan Design System
// Based on brand guidelines and accessibility requirements

export const Colors = {
  // Primary Brand Colors
  primary: {
    blue: '#2241DD', // Blue watermark
    yellow: '#fab900', // Yellow (logo only)
    green: '#8DC63F', // Green (logo only)
  },
  
  // Neutral Colors
  neutral: {
    black: '#000000',
    white: '#FFFFFF',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    }
  },
  
  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#1F2937',
    darker: '#111827',
  },
  
  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
  },
  
  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Status Colors
  status: {
    connected: '#10B981',
    disconnected: '#EF4444',
    warning: '#F59E0B',
    offline: '#6B7280',
  }
};

export const Typography = {
  // Font Families
  fontFamily: {
    heading: 'Inter-Bold', // Inter Bold for headings
    body: 'Inter-Regular', // Inter Regular for body text
    bodySemiBold: 'Inter-SemiBold', // Inter SemiBold for emphasis
  },
  
  // Design System Typography Styles - Modern Clean Style
  displayTitle: {
    fontSize: 32,
    fontWeight: '700', // Bold
    lineHeight: 1.25, // 125%
    letterSpacing: -0.02, // -2%
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
  },
  
  screenTitle: {
    fontSize: 22,
    fontWeight: '600', // SemiBold
    lineHeight: 1.3, // 130%
    letterSpacing: -0.01, // -1%
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600', // SemiBold
    lineHeight: 1.4, // 140%
    letterSpacing: -0.005, // -0.5%
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '500', // Medium
    lineHeight: 1.4, // 140%
    letterSpacing: 0, // Normal
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  
  bodyText: {
    fontSize: 15,
    fontWeight: '400', // Regular
    lineHeight: 1.5, // 150%
    letterSpacing: 0, // Normal
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
  },
  
  labelText: {
    fontSize: 13,
    fontWeight: '500', // Medium
    lineHeight: 1.4, // 140%
    letterSpacing: 0.01, // +1%
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  
  buttonText: {
    fontSize: 15,
    fontWeight: '600', // SemiBold
    lineHeight: 1.2, // 120%
    letterSpacing: 0.005, // +0.5%
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  
  // Additional typography styles for modern look
  subtitle: {
    fontSize: 14,
    fontWeight: '400', // Regular
    lineHeight: 1.4, // 140%
    letterSpacing: 0, // Normal
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  
  caption: {
    fontSize: 12,
    fontWeight: '400', // Regular
    lineHeight: 1.3, // 130%
    letterSpacing: 0.01, // +1%
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  
  // Legacy font sizes for backward compatibility
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
};

export const Spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#2241DD', // Dark blue shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#2241DD', // Dark blue shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#2241DD', // Dark blue shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  xl: {
    shadowColor: '#2241DD', // Dark blue shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const Layout = {
  // Container widths
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Breakpoints
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
};

export const Animation = {
  // Duration
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Easing
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Component-specific styles
export const ComponentStyles = {
  button: {
    primary: {
      backgroundColor: '#2241DD',
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    secondary: {
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 28,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 28,
    },
  },
  
  card: {
    default: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 36,
      borderWidth: 2,
      borderColor: '#D1D5DB', // Stronger border for elevation
      shadowColor: '#2241DD', // Dark blue shadow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    elevated: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 36,
      borderWidth: 2,
      borderColor: '#D1D5DB', // Stronger border for elevation
      shadowColor: '#2241DD', // Dark blue shadow
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
  },
  
  input: {
    default: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 28,
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
      fontFamily: 'Inter-Regular',
    },
    focused: {
      borderColor: '#2241DD',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    error: {
      borderColor: '#EF4444',
    },
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  Animation,
  ComponentStyles,
};
