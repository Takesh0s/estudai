import type { TextStyle } from 'react-native';

/** Must match the keys passed to useFonts in App.tsx. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/**
 * Figma type ramp rounded to whole units. Frames are 412 px wide, the width
 * of a typical Android screen in dp, so 1 Figma px maps to 1 dp.
 */
export const typography = {
  screenTitle: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34 },
  modalTitle: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  highlight: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
