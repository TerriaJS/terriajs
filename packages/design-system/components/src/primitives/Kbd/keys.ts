// Every key Kbd.Abbr draws: its symbol, and its name for the title. The
// modifiers' symbols follow the design; the rest are the usual ones
const KBD_KEYS = {
  command: { symbol: "⌘", title: "Command" },
  ctrl: { symbol: "⌃", title: "Control" },
  option: { symbol: "⌥", title: "Option" },
  alt: { symbol: "⌥", title: "Alt" },
  shift: { symbol: "⇧", title: "Shift" },
  windows: { symbol: "Win +", title: "Windows" },
  fn: { symbol: "Fn", title: "Function" },
  enter: { symbol: "↵", title: "Enter" },
  delete: { symbol: "⌫", title: "Delete" },
  escape: { symbol: "⎋", title: "Escape" },
  tab: { symbol: "⇥", title: "Tab" },
  capslock: { symbol: "⇪", title: "Caps Lock" },
  space: { symbol: "␣", title: "Space" },
  up: { symbol: "↑", title: "Up" },
  down: { symbol: "↓", title: "Down" },
  left: { symbol: "←", title: "Left" },
  right: { symbol: "→", title: "Right" },
  pageup: { symbol: "⇞", title: "Page Up" },
  pagedown: { symbol: "⇟", title: "Page Down" },
  home: { symbol: "↖", title: "Home" },
  end: { symbol: "↘", title: "End" },
  help: { symbol: "?", title: "Help" }
} as const;

type KbdKey = keyof typeof KBD_KEYS;

export { KBD_KEYS };
export type { KbdKey };
