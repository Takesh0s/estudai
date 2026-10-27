/**
 * Mirrors the "Cores" variable collection in Figma. Keys follow the variable
 * names (`fundo/superficie` -> `background.surface`), so a color changed in
 * the design has exactly one counterpart to update here.
 */
export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: {
    app: string;
    surface: string;
    navigation: string;
    greenSoft: string;
    highlight: string;
    neutral: string;
    orangeSoft: string;
    toggleOff: string;
    dangerSoft: string;
    danger: string;
  };
  text: {
    primary: string;
    secondary: string;
    link: string;
    highlight: string;
    onPrimary: string;
    onHighlight: string;
    placeholder: string;
  };
  border: {
    default: string;
    field: string;
  };
  brand: {
    primary: string;
  };
  danger: string;
};

const light: ThemeColors = {
  background: {
    app: '#F2EEE4',
    surface: '#FBF8F1',
    navigation: 'rgba(251, 248, 241, 0.94)',
    greenSoft: '#DCEBDD',
    highlight: '#14532D',
    neutral: '#DDD6C7',
    orangeSoft: '#F6C59A',
    toggleOff: 'rgba(189, 181, 163, 0.75)',
    dangerSoft: '#F6DCD6',
    danger: '#C53030',
  },
  text: {
    primary: '#1F2A24',
    secondary: '#5E6862',
    link: '#18733F',
    highlight: '#14532D',
    onPrimary: '#FFFFFF',
    onHighlight: '#1F2A24',
    placeholder: 'rgba(31, 42, 36, 0.42)',
  },
  border: {
    default: '#E2DBCC',
    field: 'rgba(58, 52, 38, 0.16)',
  },
  brand: {
    primary: '#1B7A43',
  },
  danger: '#C53030',
};

const dark: ThemeColors = {
  background: {
    app: '#121714',
    surface: '#1C2420',
    navigation: 'rgba(28, 36, 32, 0.78)',
    greenSoft: '#1E3A2B',
    highlight: '#274E33',
    neutral: '#9CA8A0',
    orangeSoft: '#F2A065',
    toggleOff: 'rgba(156, 168, 160, 0.5)',
    dangerSoft: '#3A2020',
    danger: '#C9423A',
  },
  text: {
    primary: '#F1F5F2',
    secondary: '#9CA8A0',
    link: '#4CC58A',
    highlight: '#86E0AC',
    onPrimary: '#FFFFFF',
    onHighlight: '#1F2933',
    placeholder: 'rgba(241, 245, 242, 0.35)',
  },
  border: {
    default: '#2F3B35',
    field: 'rgba(255, 255, 255, 0.17)',
  },
  brand: {
    primary: '#1F8A4C',
  },
  danger: '#FF7B7B',
};

export const palettes: Record<ColorScheme, ThemeColors> = { light, dark };

/** Identity colors for subjects and event types; identical in light and dark mode. */
export const subjectColors = [
  '#55B572',
  '#ED8134',
  '#FFC93C',
  '#14532D',
  '#4A90D9',
  '#9B6BD3',
] as const;

export const eventTypeColors = {
  prova: '#F28C28',
  trabalho: '#FFC93C',
  atividade: '#55B572',
  outro: '#4A90D9',
} as const;

export const urgentColor = '#ED3434';
export const avatarFallbackColor = '#F28C28';
