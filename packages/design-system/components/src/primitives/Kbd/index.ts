import { KbdAbbr, KbdContent, KbdRoot } from "./Kbd";

export { KBD_KEYS } from "./keys";
export type { KbdKey } from "./keys";

// Compound component, assembled here so Kbd.tsx only exports components
export const Kbd = Object.assign(KbdRoot, {
  Root: KbdRoot,
  Abbr: KbdAbbr,
  Content: KbdContent
});

export { KbdAbbr, KbdContent, KbdRoot };
export type {
  KbdAbbrProps,
  KbdContentProps,
  KbdProps,
  KbdVariant
} from "./Kbd";
