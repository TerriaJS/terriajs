import { runInAction } from "mobx";
import React from "react";
import styled from "styled-components";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionButton as SelectableDimensionButtonModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import _Button from "../../Styled/Button";
import Text from "../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../Custom/parseCustomMarkdownToReact";

export const SelectableDimensionButton: React.FC<{
  id: string;
  dim: SelectableDimensionButtonModel;
}> = ({ id, dim }) => {
  return (
    <Button
      onClick={() =>
        runInAction(() => dim.setDimensionValue(CommonStrata.user, true))
      }
      activeStyles
      primary={dim.buttonStyle === "primary"}
      secondary={dim.buttonStyle === "secondary"}
      warning={dim.buttonStyle === "warning"}
      fullWidth={true}
    >
      <Text textLight>
        {parseCustomMarkdownToReactWithOptions(dim.value ?? "", {
          inline: true
        })}
      </Text>
    </Button>
  );
};

const Button = styled(_Button)`
  border-radius: 4px;
`;
