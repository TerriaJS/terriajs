import React from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import {
  filterSelectableDimensions,
  isGroup,
  SelectableDimensionCheckboxGroup as SelectableDimensionCheckboxGroupModel,
  SelectableDimensionGroup as SelectableDimensionGroupModel
} from "../../Models/SelectableDimensions/SelectableDimensions";
import Box from "../../Styled/Box";
import Collapsible from "../Custom/Collapsible/Collapsible";
import SelectableDimension from "./SelectableDimension";

/**
 * Component to render a SelectableDimensionGroup or DimensionSelectorCheckboxGroup.
 */
export const SelectableDimensionGroup: React.FC<{
  id: string;
  dim: SelectableDimensionGroupModel | SelectableDimensionCheckboxGroupModel;
}> = ({ id, dim }) => {
  const childDims = filterSelectableDimensions(dim.placement)(
    dim.selectableDimensions
  );
  // Hide static groups with empty children.
  // We still show checkbox groups with empty children as they are stateful.
  if (isGroup(dim) && childDims.length === 0) return null;
  return (
    <Collapsible
      title={
        dim.type === "group"
          ? dim.name ?? dim.id ?? ""
          : dim.options?.find((opt) => opt.id === dim.selectedId)?.name ??
            (dim.selectedId === "true" ? "Enabled" : "Disabled")
      }
      bodyBoxProps={{
        displayInlineBlock: true,
        fullWidth: true
      }}
      bodyTextProps={{ large: true }}
      isOpen={dim.type === "group" ? dim.isOpen : dim.selectedId === "true"}
      onToggle={
        dim.type === "group"
          ? dim.onToggle
          : (isOpen) =>
              dim.setDimensionValue(
                CommonStrata.user,
                isOpen ? "true" : "false"
              )
      }
      btnStyle={dim.type === "checkbox-group" ? "checkbox" : undefined}
      btnRight={dim.type === "group"}
    >
      <Box displayInlineBlock fullWidth styledPadding="5px 0 0 20px">
        {/* recursively render nested dimensions */}
        {childDims.map((nestedDim) => (
          <SelectableDimension
            id={`${id}-${nestedDim.id}`}
            dim={nestedDim}
            key={`${id}-${nestedDim.id}`}
          />
        ))}
      </Box>
    </Collapsible>
  );
};
