import isPropValid from "@emotion/is-prop-valid";
import type { ShouldForwardProp } from "styled-components";

/**
 * Only forward props that are valid HTML/SVG attributes down to host elements.
 *
 * styled-components v5 filtered props with `@emotion/is-prop-valid` whenever
 * the styled target was a host element (`styled.div` and friends). v6 dropped
 * that behaviour, so every styling prop we declare - `fullWidth`, `paddedRatio`,
 * `charcoalGreyBg`, ... - now reaches the DOM and React logs an unknown prop
 * warning for each one.
 *
 * Custom components keep receiving every prop, since only they know what to do
 * with them.
 *
 * Pass this to a `StyleSheetManager` wrapping the tree.
 */
export const shouldForwardProp: ShouldForwardProp<"web"> = (
  propName,
  target
) => (typeof target === "string" ? isPropValid(propName) : true);

export default shouldForwardProp;
