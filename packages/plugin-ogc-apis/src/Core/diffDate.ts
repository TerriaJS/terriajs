type TimeUnit = { format: Intl.RelativeTimeFormatUnit; ms: number };

const second: TimeUnit = { format: "second", ms: 1000 };
const units: TimeUnit[] = [
  { format: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { format: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { format: "day", ms: 1000 * 60 * 60 * 24 },
  { format: "hour", ms: 1000 * 60 * 60 },
  { format: "minute", ms: 1000 * 60 },
  second
];

export function diffDate(date1: Date, date2: Date): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMsecs = date1.getTime() - date2.getTime(); // note: not absolute, keeps sign
  const unit = units.find(({ ms }) => Math.abs(diffMsecs) >= ms) ?? second;
  return rtf.format(Math.round(unit.ms / 1000), unit.format);
}
