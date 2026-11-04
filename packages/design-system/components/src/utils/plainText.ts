export const isText = (child: unknown): child is string | number =>
  typeof child === "string" || typeof child === "number";

// An item's text for typeahead, when its children are text alone: JSX splits
// "{name} ({count})" into several
export const plainText = (children: unknown): string | undefined => {
  const parts: unknown[] = Array.isArray(children) ? children : [children];
  return parts.every(isText) ? parts.join("") : undefined;
};
