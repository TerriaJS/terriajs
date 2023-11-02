import { createTransformer } from "mobx-utils";
import StandardCssColors from "../Core/StandardCssColors";

// Set of available colors
const colors: Readonly<string[]> = StandardCssColors.modifiedBrewer8ClassSet2;

// Keeps track of color usage counts
const usedColors: { [c: string]: number | undefined } = {};

/**
 * Returns a transformer for assigning least used color to an id.
 *
 * The transformer ensures that each `id` to color mapping is stable and if the
 * color is not used anymore, it is returned to the pool.
 */
function createColorForIdTransformer() {
  return createTransformer(
    (id: string): string => {
      const nextColor = leastUsedColor();
      useColor(nextColor);
      return nextColor;
    },
    (color) => (color ? freeColor(color) : undefined)
  );
}

function leastUsedColor(): string {
  // Sort colors by usage count and return the least used color.
  const sortedColors = colors
    .slice()
    .sort(
      (a: string, b: string) => (usedColors[a] || 0) - (usedColors[b] || 0)
    );
  return sortedColors[0];
}

function useColor(color: string) {
  usedColors[color] = (usedColors[color] || 0) + 1;
}

function freeColor(color: string) {
  const count = usedColors[color];
  if (count !== undefined) {
    if (count <= 1) {
      delete usedColors[color];
    } else {
      usedColors[color] = count - 1;
    }
  }
}

export default createColorForIdTransformer;
