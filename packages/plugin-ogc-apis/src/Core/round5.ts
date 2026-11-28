/**
 * Round decimal to 5 digits
 */
export function round5(num: number): number {
  const digits = Math.pow(10, 5);
  return Math.round((num + Number.EPSILON) * digits) / digits;
}
