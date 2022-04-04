export type constVoid = () => void;

/**
 * Makes the specified properties of T optional.
 *
 * @example
 * ```ts
 *   Optional<Button, "id" | "name">
 * ``
 */
export type Optional<T extends object, K extends keyof T = keyof T> = Omit<
  T,
  K
> &
  Partial<Pick<T, K>>;
