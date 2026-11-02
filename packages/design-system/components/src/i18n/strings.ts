// Every string the components show or announce, in English. An app adds
// other languages, or changes these, with LocalizedStringsProvider. A
// function takes the values the string is built from
type LocalizedString =
  | string
  | ((values: Record<string, string | number>) => string);

const EN_US = {
  "autocomplete.clear": "Clear selection",
  "calendar.yearPicker": (values) =>
    `${String(values["monthYear"])}, year selector`,
  "closeButton.label": "Close",
  "colorPicker.label": "Color picker",
  "dateTimeSelector.back": "Back",
  "dateTimeSelector.centuries": "Centuries",
  "dateTimeSelector.days": "Select a day",
  "dateTimeSelector.hours": "Hours",
  "dateTimeSelector.months": "Months",
  "dateTimeSelector.options": (values) =>
    `(${String(values["count"])} ${values["count"] === 1 ? "option" : "options"})`,
  "dateTimeSelector.selectCentury": "Select a century",
  "dateTimeSelector.selectHour": (values) =>
    `Select an hour on ${String(values["day"])}`,
  "dateTimeSelector.selectTime": "Select a time",
  "dateTimeSelector.selectYear": "Select a year",
  "dateTimeSelector.times": "Times",
  "dateTimeSelector.years": "Years",
  "kbd.alt": "Alt",
  "kbd.capslock": "Caps Lock",
  "kbd.command": "Command",
  "kbd.ctrl": "Control",
  "kbd.delete": "Delete",
  "kbd.down": "Down",
  "kbd.end": "End",
  "kbd.enter": "Enter",
  "kbd.escape": "Escape",
  "kbd.fn": "Function",
  "kbd.help": "Help",
  "kbd.home": "Home",
  "kbd.left": "Left",
  "kbd.option": "Option",
  "kbd.pagedown": "Page Down",
  "kbd.pageup": "Page Up",
  "kbd.right": "Right",
  "kbd.shift": "Shift",
  "kbd.space": "Space",
  "kbd.tab": "Tab",
  "kbd.up": "Up",
  "kbd.windows": "Windows",
  "pagination.label": "Pagination",
  "pagination.page": (values) => `Page ${String(values["page"])}`,
  "select.clear": "Clear selection",
  "select.clearHint": "Press backspace or delete to clear value",
  "tabs.scrollNext": "Scroll to next tabs",
  "tabs.scrollPrevious": "Scroll to previous tabs",
  "tree.loading": "Loading…"
} satisfies Record<string, LocalizedString>;

type LocalizedStringKey = keyof typeof EN_US;

export { EN_US };
export type { LocalizedString, LocalizedStringKey };
