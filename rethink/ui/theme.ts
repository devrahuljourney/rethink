import { Platform } from 'react-native'

// Paper + ink, with flat poster colours. Every surface is outlined in ink; no glows, no gradients.
export const palette = {
  paper: '#F3EEE3',
  card: '#FFFCF5',
  ink: '#1B1A1F',
  inkSoft: '#57534B',
  inkFaint: '#9A948A',
  line: '#E2DACB',

  tomato: '#FF6B4A',
  cobalt: '#3D4ED8',
  sun: '#FFDD3C',
  mint: '#8EDFC0',
  lilac: '#C3B4FF',
  peach: '#FFC9AE',
}

export type Tone = 'tomato' | 'cobalt' | 'sun' | 'mint' | 'lilac' | 'peach' | 'card' | 'ink' | 'paper'

export const toneBg = (tone: Tone) => palette[tone]

// Text colour that reads on a given fill.
export const toneInk = (tone: Tone) =>
  tone === 'ink' || tone === 'cobalt' ? palette.card : palette.ink

// Android resolves custom fonts by file name, iOS by PostScript name.
const pick = (android: string, ios: string) => Platform.select({ android, ios, default: android })

export const font = {
  display: pick('Bricolage-ExtraBold', 'BricolageGrotesque96ptExtraBold-ExtraBold'),
  displayBold: pick('Bricolage-Bold', 'BricolageGrotesque96ptExtraBold-Bold'),
  body: pick('Figtree-Medium', 'FigtreeLight-Medium'),
  bodySemi: pick('Figtree-SemiBold', 'FigtreeLight-SemiBold'),
  bodyBold: pick('Figtree-Bold', 'FigtreeLight-Bold'),
  mono: pick('DMMono-Medium', 'DMMono-Medium'),
}

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 }
export const stroke = 2

// Tab bar floats over content; scroll views on tab screens pad by this much.
export const TAB_BAR_SPACE = 120
