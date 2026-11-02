// Every key Kbd.Abbr draws, by its symbol; its name, the title, is the
// localized kbd.<key> string. The modifiers' symbols follow the design; the
// rest are the usual ones
const KBD_KEYS = {
  command: { symbol: "⌘" },
  ctrl: { symbol: "⌃" },
  option: { symbol: "⌥" },
  alt: { symbol: "⌥" },
  shift: { symbol: "⇧" },
  windows: { symbol: "Win +" },
  fn: { symbol: "Fn" },
  enter: { symbol: "↵" },
  delete: { symbol: "⌫" },
  escape: { symbol: "⎋" },
  tab: { symbol: "⇥" },
  capslock: { symbol: "⇪" },
  space: { symbol: "␣" },
  up: { symbol: "↑" },
  down: { symbol: "↓" },
  left: { symbol: "←" },
  right: { symbol: "→" },
  pageup: { symbol: "⇞" },
  pagedown: { symbol: "⇟" },
  home: { symbol: "↖" },
  end: { symbol: "↘" },
  help: { symbol: "?" }
} as const;

type KbdKey = keyof typeof KBD_KEYS;

export { KBD_KEYS };
export type { KbdKey };
