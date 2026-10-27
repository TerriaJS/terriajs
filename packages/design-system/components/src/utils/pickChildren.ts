import {
  Children,
  isValidElement,
  type ElementType,
  type ReactNode
} from "react";

// Splits children into those of one component and the rest, so a part given
// as a child, like a custom remove button, can replace a default and be
// placed where the component puts it
const pickChildren = <T = ReactNode>(
  children: T | undefined,
  targetChild: ElementType
): [T | undefined, T[] | undefined] => {
  const target: T[] = [];

  // eslint-disable-next-line @eslint-react/no-children-map -- Only sorts the children, to take out the target's
  const withoutTargetChildren = Children.map(children, (item) => {
    if (!isValidElement(item)) return item;
    if (item.type === targetChild) {
      target.push(item as T);
      return null;
    }
    return item;
  })?.filter(Boolean) as T;

  return [withoutTargetChildren, target.length > 0 ? target : undefined];
};

export { pickChildren };
