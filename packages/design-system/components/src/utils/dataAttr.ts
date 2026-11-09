type Booleanish = boolean | "true" | "false";

// A data attribute's value from a condition: "true" while it holds, else
// left off the element, so CSS can match on the attribute being there
const dataAttr = (condition: boolean | undefined): Booleanish | undefined =>
  condition ? "true" : undefined;

export { dataAttr };
export type { Booleanish };
