export function getOffsetMinutes(timeZone: string): number {
  const [hoursString, minutesString] = timeZone.split(":");
  const hours = parseInt(hoursString);
  const minutes = parseInt(minutesString);
  return hours * 60 + minutes;
}
