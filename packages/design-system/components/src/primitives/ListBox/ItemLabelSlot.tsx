import type { ReactNode } from "react";
import { LabelContext } from "react-aria-components/Label";
import { useSlottedContext } from "react-aria-components/slots";
import { TextContext } from "react-aria-components/Text";

// Items take their name from text in their "label" slot, not from a Label.
// This hands that slot's id to a Label inside the item, so <Label> names an
// item as it names a field; without one, the item's text names it
export const ItemLabelSlot = ({
  children
}: {
  children: ReactNode;
}): React.ReactElement => {
  const label = useSlottedContext(TextContext, "label");

  return (
    <LabelContext.Provider
      value={label?.id ? { id: label.id, elementType: "span" } : null}
    >
      {children}
    </LabelContext.Provider>
  );
};
