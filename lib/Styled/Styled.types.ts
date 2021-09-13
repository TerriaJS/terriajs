export type Overflow =
  | "visible"
  | "hidden"
  | "scroll"
  | "auto"
  | "initial"
  | "inherit";

export type WordBreak =
  | "normal"
  | "break-all"
  | "keep-all"
  | "break-word"
  | "initial"
  | "inherit";

export type WhiteSpace =
  | "normal"
  | "nowrap"
  | "pre"
  | "pre-line"
  | "pre-wrap"
  | "initial"
  | "inherit";

export type OneKeyFrom<T, K extends keyof T = keyof T> = K extends any
  ? Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>> extends infer O
    ? { [P in keyof O]: O[P] }
    : never
  : never;

/**
 * Types that can be used after upgrade to ts4.
 */

// type StyledSizePx = `${number}px`
// type StyledSizePercent = `${number}%`
// export type StyledSize = StyledSizePx | StyledSizePercent | `calc(${string})`;
// type Color = `#${string}` | `rgb(${number},${number},${number})` | `rgba(${number}, ${number}, ${number}, ${number})` | `hsl(${number}, ${number}%, ${number}%)` | `hsla(${number}, ${number}%, ${number}%, ${number}%)` | string;

// type FlexGrow = number | "initial" | "inherit";
// type FlexShrink = number | "initial" | "inherit";
// type FlexBasis = StyledSize | "auto" | "initial" | "inherit";
// export type Flex = FlexGrow | FlexShrink | FlexBasis | `${FlexGrow} ${FlexShrink} ${FlexBasis}`;
