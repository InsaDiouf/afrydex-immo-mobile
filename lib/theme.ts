import { Platform } from 'react-native';

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  text2: string;
  text3: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  heroFrom: string;
  heroTo: string;
  heroText: string;
  success: string; successSoft: string; successText: string;
  warn: string;    warnSoft: string;    warnText: string;
  danger: string;  dangerSoft: string;  dangerText: string;
  info: string;    infoSoft: string;    infoText: string;
  shadow: object;
  shadowSoft: object;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!r) return `rgba(37,99,235,${alpha})`;
  return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
}

function darken(hex: string, pct = 0.18): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!r) return hex;
  const ch = (v: number) => Math.max(0, Math.round(v * (1 - pct))).toString(16).padStart(2, '0');
  return `#${ch(parseInt(r[1], 16))}${ch(parseInt(r[2], 16))}${ch(parseInt(r[3], 16))}`;
}

const iosShadow = (y: number, blur: number, opacity: number) =>
  Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: blur }
    : { elevation: Math.round(blur / 3) };

export function buildTheme(dark: boolean, accent = '#2563eb'): Theme {
  const accentDark = darken(accent, 0.12);

  if (dark) {
    return {
      dark: true,
      bg: '#0b0e10',
      surface: '#15191d',
      surface2: '#1b2127',
      text: '#eef1f3',
      text2: '#9aa3ab',
      text3: '#646d75',
      border: 'rgba(255,255,255,0.08)',
      borderStrong: 'rgba(255,255,255,0.14)',
      accent,
      accentText: hexToRgba(accent, 1),
      accentSoft: hexToRgba(accent, 0.18),
      heroFrom: accent,
      heroTo: darken(accent, 0.25),
      heroText: '#eaf1ff',
      success: '#22c55e', successSoft: 'rgba(34,197,94,0.16)',   successText: '#4ade80',
      warn:    '#f59e0b', warnSoft:    'rgba(245,158,11,0.16)',   warnText:    '#fbbf24',
      danger:  '#f87171', dangerSoft:  'rgba(248,113,113,0.16)',  dangerText:  '#fca5a5',
      info:    '#60a5fa', infoSoft:    'rgba(96,165,250,0.16)',   infoText:    '#93c5fd',
      shadow: { ...iosShadow(8, 24, 0.4) },
      shadowSoft: { ...iosShadow(2, 8, 0.35) },
    };
  }
  return {
    dark: false,
    bg: '#eef0f4',
    surface: '#ffffff',
    surface2: '#f4f6f9',
    text: '#0e1626',
    text2: '#5c6678',
    text3: '#97a0b0',
    border: 'rgba(14,22,38,0.07)',
    borderStrong: 'rgba(14,22,38,0.12)',
    accent,
    accentText: accentDark,
    accentSoft: hexToRgba(accent, 0.1),
    heroFrom: accent,
    heroTo: darken(accent, 0.12),
    heroText: '#ffffff',
    success: '#16a34a', successSoft: '#e6f6ec', successText: '#15803d',
    warn:    '#d97706', warnSoft:    '#fbf0db', warnText:    '#b45309',
    danger:  '#dc2626', dangerSoft:  '#fbe7e7', dangerText:  '#b91c1c',
    info:    accentDark, infoSoft:   hexToRgba(accent, 0.1), infoText: accentDark,
    shadow: { ...iosShadow(10, 30, 0.08) },
    shadowSoft: { ...iosShadow(4, 14, 0.06) },
  };
}
