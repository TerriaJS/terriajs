/**
 * Returns a promise that resolves in milliseconds.
 */
export default function timeout(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
