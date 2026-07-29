// Shared UI primitives for the Agency portal — mirrors the reference design
import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme, hexToRgba } from '@/lib/theme';

// ── Icons ─────────────────────────────────────────────────────────
const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  contract: 'M7 3h7l5 5v13a0 0 0 0 1 0 0H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z|M14 3v5h5|M9 13h6M9 17h4',
  wallet: 'M3 7.5A1.5 1.5 0 0 1 4.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z|M16 12.5h2.5|M3 8h13',
  wrench: 'M14.5 6.5a3.8 3.8 0 0 1-5 5L5 16a2 2 0 1 0 3 3l4.5-4.5a3.8 3.8 0 0 0 5-5l-2 2-2.5-.5-.5-2.5 2-2Z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6|M10 20a2 2 0 0 0 4 0',
  chevR: 'M9 5l7 7-7 7',
  chevL: 'M15 5l-7 7 7 7',
  chevDown: 'M5 9l7 7 7-7',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M5 19h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z|M12 7.5V12l3 2',
  alert: 'M12 3 2.5 20h19L12 3Z|M12 10v4|M12 17.5v.2',
  building: 'M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16|M9 21v-4h4v4|M8.5 7h1m4 0h1m-6 4h1m4 0h1|M5 21h14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z|M5 20a7 7 0 0 1 14 0',
  phone: 'M5 4h3l1.5 4.5L7.5 10a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  lock: 'M6 10V8a6 6 0 0 1 12 0v2|M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z|M12 14v2',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z|M3 12h18|M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z',
  calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Z|M4 9h16|M8 3v4M16 3v4',
  mapPin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  receipt: 'M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z|M9 8h6M9 12h6',
  shield: 'M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z|M9 12l2 2 4-4',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z|M16.5 16.5 21 21',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  arrowR: 'M5 12h14m0 0-6-6m6 6-6 6',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  camera: 'M4 8a2 2 0 0 1 2-2h1.5l1.2-1.8a1 1 0 0 1 .8-.4h5a1 1 0 0 1 .8.4L17.5 6H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z|M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  zap: 'M13 3 4 14h7l-1 7 9-11h-7l1-7Z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18|M10.5 6.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.6M6 7.2A16 16 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 3.4-.6|M9.9 9.9a3 3 0 0 0 4.2 4.2',
  logout: 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3|M10 12h9m0 0-3-3m3 3-3 3',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z|M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 3.5 3.5M20.5 20.5 19 19M19 5l1.5-1.5M3.5 20.5 5 19',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z',
  star: 'M12 4l2.4 5 5.6.8-4 4 1 5.6L12 16.8 7 19.4l1-5.6-4-4 5.6-.8L12 4Z',
  key: 'M14 7a3 3 0 1 1-2.8 4H8v2H6v2H3v-3l5.2-5.2A3 3 0 0 1 14 7Z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z|M2.5 20a6.5 6.5 0 0 1 13 0|M16 4.2a3.5 3.5 0 0 1 0 6.6|M17.5 13.6A6.5 6.5 0 0 1 21.5 20',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M19.4 13a7.8 7.8 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.8 7.8 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7.8 7.8 0 0 0-1.7 1l-2.3-1-2 3.4L4.6 11a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.8 7.8 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.8 7.8 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5Z',
  trendUp: 'M3 17l6-6 4 4 8-8|M15 7h6v6',
  trendDown: 'M3 7l6 6 4-4 8 8|M15 17h6v-6',
  cart: 'M3 4h2l2.4 12.5a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 8H6|M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z|M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  filter: 'M3 5h18l-7 8v5l-4 2v-7L3 5Z',
  percent: 'M5 19 19 5|M7.5 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z|M16.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  briefcase: 'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z|M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6|M3 12h18',
  coins: 'M9 8a6 3 0 1 0 0-6 6 3 0 0 0 0 6Z|M3 5v6c0 1.7 2.7 3 6 3s6-1.3 6-3V5|M15 11.2c2.3.3 4 1.4 4 2.8 0 1.7-2.7 3-6 3-1 0-2-.1-2.8-.3|M3 11v6c0 1.7 2.7 3 6 3 1 0 2-.1 2.8-.3',
  doc: 'M7 3h7l5 5v13a0 0 0 0 1 0 0H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z|M14 3v5h5',
  bolt: 'M13 3 4 14h7l-1 7 9-11h-7l1-7Z',
  hammer: 'M14 6l4 4-7 7-4-4 7-7Z|M14 6l2.5-2.5a2 2 0 0 1 3 3L17 9|M7 13l-4 4a2 2 0 0 0 3 3l4-4',
  paint: 'M19 3H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h9a2 2 0 0 1 2 2v1a3 3 0 1 0 3-3V5a2 2 0 0 0-2-2Z',
  pin2: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  bed: 'M3 18V8m0 6h18m0 4v-6a3 3 0 0 0-3-3H8m-5 3V6|M6.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  mail: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z|M2 7l10 7 10-7',
  map: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  chevD: 'M5 9l7 7 7-7',
  pen: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M12 8h.01|M12 12v4',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8|M16 6l-4-4-4 4|M12 2v13',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z|M4 22v-7',
};

interface IcProps {
  name: string;
  size?: number;
  color?: string;
  sw?: number;
  fill?: boolean;
}
export function Ic({ name, size = 22, color = '#000', sw = 1.8, fill = false }: IcProps) {
  const segs = (PATHS[name] ?? '').split('|');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {segs.map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
          fill={fill ? color : 'none'} />
      ))}
    </Svg>
  );
}

// ── Card ──────────────────────────────────────────────────────────
interface CardProps {
  t: Theme;
  children: React.ReactNode;
  pad?: number;
  style?: ViewStyle;
}
export function Card({ t, children, pad = 16, style }: CardProps) {
  return (
    <View style={[{
      backgroundColor: t.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.border,
      padding: pad,
      ...t.shadowSoft,
    }, style]}>
      {children}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────
type Tone = 'success' | 'warn' | 'danger' | 'info' | 'neutral';
interface BadgeProps {
  t: Theme;
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
}
export function Badge({ t, tone = 'success', dot = false, children }: BadgeProps) {
  const map: Record<Tone, [string, string, string]> = {
    success: [t.success, t.successSoft, t.successText],
    warn:    [t.warn,    t.warnSoft,    t.warnText],
    danger:  [t.danger,  t.dangerSoft,  t.dangerText],
    info:    [t.info,    t.infoSoft,    t.infoText],
    neutral: [t.text2,   t.surface2,    t.text2],
  };
  const [base, bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: base }} />}
      <Text style={{ color: fg, fontWeight: '600', fontSize: 12, lineHeight: 14 }}>{children}</Text>
    </View>
  );
}

// ── Btn ───────────────────────────────────────────────────────────
type BtnKind = 'primary' | 'soft' | 'ghost' | 'dangerSoft' | 'white';
interface BtnProps {
  t: Theme;
  children: React.ReactNode;
  kind?: BtnKind;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}
export function Btn({ t, children, kind = 'primary', icon, size = 'md', full = false, onPress, style, disabled }: BtnProps) {
  const h = size === 'lg' ? 54 : size === 'sm' ? 40 : 48;
  const fs = size === 'lg' ? 16 : size === 'sm' ? 14 : 15;
  const ic = size === 'lg' ? 20 : 18;
  const kinds: Record<BtnKind, ViewStyle & { color?: string }> = {
    primary:    { backgroundColor: t.accent },
    soft:       { backgroundColor: t.accentSoft },
    ghost:      { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: t.borderStrong },
    dangerSoft: { backgroundColor: t.dangerSoft },
    white:      { backgroundColor: '#fff', ...t.shadowSoft as any },
  };
  const textColors: Record<BtnKind, string> = {
    primary: '#fff',
    soft: t.accentText,
    ghost: t.text,
    dangerSoft: t.dangerText,
    white: '#1d4ed8',
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.78}
      style={[{
        height: h, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8, paddingHorizontal: 20,
        width: full ? '100%' : undefined, opacity: disabled ? 0.5 : 1,
        ...kinds[kind],
      }, style]}
    >
      {icon && <Ic name={icon} size={ic} color={textColors[kind]} sw={2} />}
      <Text style={{ color: textColors[kind], fontWeight: '700', fontSize: fs, letterSpacing: 0.1 }}>{children}</Text>
    </TouchableOpacity>
  );
}

// ── IconBtn ───────────────────────────────────────────────────────
interface IconBtnProps { t: Theme; name: string; onAccent?: boolean; size?: number; badge?: boolean; onPress?: () => void; }
export function IconBtn({ t, name, onAccent = false, size = 40, badge = false, onPress }: IconBtnProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
      width: size, height: size, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
      backgroundColor: onAccent ? 'rgba(255,255,255,0.18)' : t.surface2,
      borderWidth: 1, borderColor: onAccent ? 'rgba(255,255,255,0.18)' : t.border,
    }}>
      <Ic name={name} size={20} color={onAccent ? '#fff' : t.text} sw={1.9} />
      {badge && (
        <View style={{
          position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4,
          backgroundColor: t.danger, borderWidth: 2,
          borderColor: onAccent ? t.heroFrom : t.surface,
        }} />
      )}
    </TouchableOpacity>
  );
}

// ── Avatar ────────────────────────────────────────────────────────
interface AvatarProps { t: Theme; initials: string; size?: number; color?: string; }
export function Avatar({ t, initials, size = 44, color }: AvatarProps) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color ?? t.accentSoft, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: color ? '#fff' : t.accentText, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// ── Progress ──────────────────────────────────────────────────────
interface ProgressProps { t: Theme; value: number; tone?: string; }
export function Progress({ t, value, tone }: ProgressProps) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: t.dark ? 'rgba(255,255,255,0.08)' : '#eceeed', overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: 4, backgroundColor: tone ?? t.accent }} />
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────
export function Divider({ t, m = 0 }: { t: Theme; m?: number }) {
  return <View style={{ height: 1, backgroundColor: t.border, marginVertical: m }} />;
}

// ── Tile ──────────────────────────────────────────────────────────
interface TileProps { t: Theme; name: string; tone?: Tone | 'accent'; size?: number; }
export function Tile({ t, name, tone = 'accent', size = 44 }: TileProps) {
  const map: Record<string, [string, string]> = {
    success: [t.successSoft, t.successText],
    warn:    [t.warnSoft,    t.warnText],
    danger:  [t.dangerSoft,  t.dangerText],
    info:    [t.infoSoft,    t.infoText],
    accent:  [t.accentSoft,  t.accentText],
    neutral: [t.surface2,    t.text2],
  };
  const [bg, fg] = map[tone] ?? map.accent;
  return (
    <View style={{ width: size, height: size, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ic name={name} size={size * 0.5} color={fg} sw={1.9} />
    </View>
  );
}

// ── Headers ───────────────────────────────────────────────────────
export const STATUS_BAR_H = 52;

interface TabHeaderProps {
  t: Theme;
  title: string;
  kicker?: string;
  right?: React.ReactNode;
}
export function TabHeader({ t, title, kicker, right }: TabHeaderProps) {
  return (
    <View style={{ paddingTop: STATUS_BAR_H, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {kicker && <Text style={{ fontWeight: '600', fontSize: 13, color: t.accentText, letterSpacing: 0.2, marginBottom: 3 }}>{kicker}</Text>}
          <Text style={{ fontWeight: '700', fontSize: 28, letterSpacing: -0.5, color: t.text, lineHeight: 30 }}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
}

interface DetailHeaderProps {
  t: Theme;
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}
export function DetailHeader({ t, title, right, onBack }: DetailHeaderProps) {
  return (
    <View style={{
      paddingTop: STATUS_BAR_H, paddingHorizontal: 16, paddingBottom: 12,
      backgroundColor: t.bg, flexDirection: 'row', alignItems: 'center', gap: 10,
    }}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={{
        width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface,
        borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', ...t.shadowSoft as any,
      }}>
        <Ic name="chevL" size={20} color={t.text} sw={2.2} />
      </TouchableOpacity>
      <Text style={{ flex: 1, fontWeight: '700', fontSize: 18, letterSpacing: -0.2, color: t.text, textAlign: 'center' }} numberOfLines={1}>{title}</Text>
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>{right}</View>
    </View>
  );
}

// ── KV row ────────────────────────────────────────────────────────
interface KVProps { t: Theme; k: string; v: string; accent?: boolean; last?: boolean; }
export function KV({ t, k, v, accent = false, last = false }: KVProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.border }}>
      <Text style={{ fontSize: 14, color: t.text2 }}>{k}</Text>
      <Text style={{ fontWeight: '700', fontSize: 14.5, color: accent ? t.accentText : t.text }}>{v}</Text>
    </View>
  );
}

// ── Row ───────────────────────────────────────────────────────────
interface RowProps { t: Theme; tile?: string; tone?: Tone | 'accent'; title: string; sub?: string; right?: React.ReactNode; mb?: number; }
export function Row({ t, tile, tone, title, sub, right, mb = 0 }: RowProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: mb }}>
      {tile && <Tile t={t} name={tile} tone={tone} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text, letterSpacing: -0.1 }} numberOfLines={1}>{title}</Text>
        {sub && <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }} numberOfLines={1}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

// ── Chips (horizontal filter bar) ─────────────────────────────────
interface ChipsProps { t: Theme; items: string[]; active: string; onSelect?: (v: string) => void; }
export function Chips({ t, items, active, onSelect }: ChipsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((it) => {
        const on = it === active;
        return (
          <TouchableOpacity key={it} onPress={() => onSelect?.(it)} activeOpacity={0.7} style={{
            paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999,
            backgroundColor: on ? t.accent : t.surface,
            borderWidth: 1, borderColor: on ? t.accent : t.border,
          }}>
            <Text style={{ fontWeight: '600', fontSize: 13, color: on ? '#fff' : t.text2 }} numberOfLines={1}>{it}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Seg (segmented control) ───────────────────────────────────────
interface SegProps { t: Theme; items: string[]; active: string; onSelect?: (v: string) => void; }
export function Seg({ t, items, active, onSelect }: SegProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.surface2, borderRadius: 13, padding: 3, borderWidth: 1, borderColor: t.border }}>
      {items.map((it) => {
        const on = it === active;
        return (
          <TouchableOpacity key={it} onPress={() => onSelect?.(it)} activeOpacity={0.7} style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: on ? t.surface : 'transparent', ...on ? t.shadowSoft as any : {} }}>
            <Text style={{ fontWeight: '700', fontSize: 13.5, color: on ? t.accentText : t.text2 }}>{it}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Sparkline bars ────────────────────────────────────────────────
interface SparkProps { data: number[]; color: string; h?: number; }
export function Spark({ data, color, h = 40 }: SparkProps) {
  const max = Math.max(...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: h }}>
      {data.map((v, i) => (
        <View key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, backgroundColor: color, borderRadius: 3, minHeight: 4, opacity: 0.35 + (i / data.length) * 0.65 }} />
      ))}
    </View>
  );
}

// ── Photo placeholder ─────────────────────────────────────────────
interface PhotoProps { t: Theme; h?: number; r?: number; }
export function PhotoPlaceholder({ t, h = 96, r = 14 }: PhotoProps) {
  return (
    <View style={{ height: h, borderRadius: r, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
      <Ic name="camera" size={28} color={t.text3} sw={1.6} />
    </View>
  );
}

// ── État d'erreur ─────────────────────────────────────────────────
// Sans cela, une requête en échec affiche l'état vide ("Aucun contrat") et
// l'utilisateur ne distingue pas "pas de données" de "serveur injoignable".
interface ErrorStateProps { t: Theme; onRetry?: () => void; message?: string; }
export function ErrorState({ t, onRetry, message }: ErrorStateProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 44, paddingHorizontal: 28, gap: 11 }}>
      <Tile t={t} name="alert" tone="danger" size={48} />
      <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, textAlign: 'center' }}>
        Chargement impossible
      </Text>
      <Text style={{ fontSize: 13, color: t.text2, textAlign: 'center', lineHeight: 19 }}>
        {message ?? 'Vérifie ta connexion internet, puis réessaie.'}
      </Text>
      {onRetry && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onRetry}
          style={{ marginTop: 4, backgroundColor: t.accent, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 22 }}
        >
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Money formatter ───────────────────────────────────────────────
export function fmt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
export function money(n: number): string { return fmt(n) + ' FCFA'; }

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

