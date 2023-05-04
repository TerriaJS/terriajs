import { runInAction } from "mobx";
import React from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionButton as SelectableDimensionButtonModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import { StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../Custom/parseCustomMarkdownToReact";
import Button from "../../Styled/Button";

export const SelectableDimensionButton: React.FC<{
  id: string;
  dim: SelectableDimensionButtonModel;
}> = ({ id, dim }) => {
  const icon = dim.icon;
  return (
    <Button
      onClick={() =>
        runInAction(() => dim.setDimensionValue(CommonStrata.user, true))
      }
      activeStyles
      shortMinHeight
      renderIcon={
        icon &&
        (() => (
          <StyledIcon
            glyph={icon}
            light
            styledWidth="16px"
            styledHeight="16px"
          />
        ))
      }
      style={{ backgroundColor: "transparent" }}
    >
      <div style={{ display: "flex" }}>
        <Text textLight>
          {parseCustomMarkdownToReactWithOptions(dim.value ?? "", {
            inline: true
          })}
        </Text>
      </div>
    </Button>
  );
};
