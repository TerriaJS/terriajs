/**
 * Returns array of capture groups for each match
 */

export function regexMatches(regex: RegExp, str: string) {
  const m: string[][] = [];
  let matches: RegExpExecArray | null;

  while ((matches = regex.exec(str))) {
    matches.splice(0, 1);
    m.push(matches.map(decodeURIComponent));
  }
  return m;
}
