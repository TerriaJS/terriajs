import { runInAction } from "mobx";
import React from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionButton as SelectableDimensionButtonModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../Custom/parseCustomMarkdownToReact";

export const SelectableDimensionButton: React.FC<{
  id: string;
  dim: SelectableDimensionButtonModel;
}> = ({ id, dim }) => {
  return (
    <RawButton
      onClick={() =>
        runInAction(() => dim.setDimensionValue(CommonStrata.user, true))
      }
      activeStyles
    >
      <Text textLight>
        {parseCustomMarkdownToReactWithOptions(dim.value ?? "", {
          inline: true
        })}
      </Text>
    </RawButton>
  );
};
