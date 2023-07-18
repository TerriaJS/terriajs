export function getOffsetMinutes(timeZone: string): number {
  // use a regex to check if timeZone is in format +/-HH:MM
  const regexHHMM = new RegExp(/^([+-])(\d{2}):(\d{2})$/);
  const match = timeZone.match(regexHHMM);

  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours * 60 + minutes);
  } else {
    // use a regex to check if timeZone is in format +/-HH
    const regexHH = new RegExp(/^([+-])(\d{2})$/);
    const match = timeZone.match(regexHH);
    if (match) {
      const sign = match[1] === "-" ? -1 : 1;
      const hours = parseInt(match[2], 10);
      return sign * hours * 60;
    } else {
      return 0;
    }
  }
}
