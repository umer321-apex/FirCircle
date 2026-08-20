// const colors = {
//   primary: '#FF5A3C',      // energetic coral-orange — main brand color
//   primaryDark: '#E1441F',
//   accent: '#00D9A3',       // vibrant mint-green — success/progress accents
//   background: '#0F1115',   // deep charcoal (dark mode base)
//   surface: '#1B1E24',      // card/surface background
//   surfaceLight: '#262A32',
//   text: '#F5F6F8',
//   muted: '#8A8F98',
//   border: '#2E323B',
//   success: '#00D9A3',
//   danger: '#FF4D4D',
//   warning: '#FFB020',
//   white: '#FFFFFF',
//   black: '#000000',
// };

// const spacing = {
//   xs: 4,
//   sm: 8,
//   md: 16,
//   lg: 24,
//   xl: 32,
//   xxl: 48,
// };

// const radius = {
//   sm: 6,
//   md: 12,
//   lg: 20,
//   xl: 28,
//   full: 9999,
// };

// const fontSize = {
//   xs: 12,
//   sm: 14,
//   md: 16,
//   lg: 20,
//   xl: 26,
//   xxl: 34,
// };

// const fontWeight = {
//   regular: '400',
//   medium: '500',
//   semibold: '600',
//   bold: '700',
//   heavy: '800',
// };

// const shadow = {
//   card: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 4,
//   },
// };

// const theme = {
//   colors,
//   spacing,
//   radius,
//   fontSize,
//   fontWeight,
//   shadow,
// };

// export default theme;


const darkColors = {
  // Surfaces (layered depth)
  background: '#131313',
  surface: '#131313',
  surfaceLow: '#1c1b1b',
  surfaceContainer: '#201f1f',
  surfaceHigh: '#2a2a2a',
  surfaceHighest: '#353534',
  surfaceBright: '#393939',
  surfaceLowest: '#0e0e0e',

  // Text
  text: '#e5e2e1',
  textVariant: '#b9cacb',
  muted: '#849495',
  outlineVariant: '#3a494b',
  border: '#3a494b',

  // Primary — Cyan (main brand, check-ins, primary actions)
  primary: '#00dbe7',
  primaryLight: '#74f5ff',
  primaryContainer: '#00f2ff',
  onPrimary: '#00363a',

  // Secondary — Lime (active states, CTAs, "on fire" energy)
  secondary: '#c3f400',
  secondaryDim: '#abd600',
  onSecondary: '#283500',

  // Tertiary — Gold (Premium, Elite, Coach marketplace)
  tertiary: '#ffe16d',
  tertiaryDim: '#e9c400',
  tertiaryContainer: '#ffd81d',
  onTertiary: '#3a3000',

  // Status
  success: '#c3f400', // reuses secondary lime for consistency with the design
  danger: '#ffb4ab',
  warning: '#ffd81d',
  white: '#ffffff',
  black: '#000000',
};

const lightColors = {
  // Apple Fitness–inspired light mode (kept from earlier direction,
  // since Stitch's screens were dark-only — light needs a parallel system)
  background: '#F7F7F9',
  surface: '#FFFFFF',
  surfaceLow: '#F0F0F3',
  surfaceContainer: '#F0F0F3',
  surfaceHigh: '#E8E8EC',
  surfaceHighest: '#E0E0E5',
  surfaceBright: '#FFFFFF',
  surfaceLowest: '#FFFFFF',

  text: '#1C1C1E',
  textVariant: '#48484A',
  muted: '#8E8E93',
  outlineVariant: '#E5E5EA',
  border: '#E5E5EA',

  primary: '#00A8B5', // darker cyan for light-mode contrast
  primaryLight: '#00C4D4',
  primaryContainer: '#00A8B5',
  onPrimary: '#FFFFFF',

  secondary: '#7CB800', // darker lime for light-mode contrast
  secondaryDim: '#6BA000',
  onSecondary: '#FFFFFF',

  tertiary: '#B8960C',
  tertiaryDim: '#9C7D00',
  tertiaryContainer: '#B8960C',
  onTertiary: '#FFFFFF',

  success: '#30A000',
  danger: '#D93025',
  warning: '#B8960C',
  white: '#FFFFFF',
  black: '#000000',
};

const spacing = {
  xs: 4,
  sm: 8,      // 'base' in Stitch
  md: 12,     // 'stack-md'
  lg: 16,     // 'gutter'
  xl: 24,     // 'stack-lg'
  xxl: 40,    // 'section-gap'
  containerMargin: 20,
};

const radius = {
  sm: 2,   // Stitch DEFAULT
  md: 4,   // Stitch lg
  lg: 8,   // Stitch xl
  xl: 12,  // Stitch full (used on cards)
  full: 9999, // true pill/circle
};

const fontFamily = {
  display: 'Anton_400Regular',       // headlines, logo, big stats
  body: 'HankenGrotesk_400Regular',  // body text
  bodyBold: 'HankenGrotesk_700Bold',
  label: 'JetBrainsMono_600SemiBold', // uppercase tracked labels/tags
};

const fontSize = {
  xs: 12,        // label-caps
  sm: 14,        // body-sm
  md: 16,        // body-lg
  title: 20,     // title-md
  headline: 28,  // headline-lg-mobile
  display: 48,   // display-lg
};

const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Colored glow shadows — the signature Stitch effect
const glow = {
  primary: {
    shadowColor: '#00dbe7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondary: {
    shadowColor: '#c3f400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  tertiary: {
    shadowColor: '#ffd81d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#00dbe7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
};

const darkTheme = {
  colors: darkColors,
  spacing,
  radius,
  fontFamily,
  fontSize,
  fontWeight,
  glow,
  mode: 'dark',
};

const lightTheme = {
  colors: lightColors,
  spacing,
  radius,
  fontFamily,
  fontSize,
  fontWeight,
  glow: {
    // Glow reads poorly on white — light mode uses ordinary soft shadows instead
    primary: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    secondary: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    tertiary: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  },
  mode: 'light',
};

export { darkTheme, lightTheme };
export default darkTheme; // fallback default export for any file not yet migrated to useTheme()