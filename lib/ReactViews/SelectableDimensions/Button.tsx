import { runInAction } from "mobx";
import { FC } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionButton as SelectableDimensionButtonModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import { StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../Custom/parseCustomMarkdownToReact";
import Button from "../../Styled/Button";
import AnimatedSpinnerIcon from "../../Styled/AnimatedSpinnerIcon";

export const SelectableDimensionButton: FC<{
  id: string;
  dim: SelectableDimensionButtonModel;
}> = ({ dim }) => {
  const iconGlyph = dim.icon;
  const iconProps = { light: true, styledWidth: "16px", styledHeight: "16px" };
  const variant = dim.variant ?? "default";
  return (
    <Button
      onClick={() =>
        runInAction(() => dim.setDimensionValue(CommonStrata.user, true))
      }
      fullWidth
      activeStyles
      shortMinHeight
      renderIcon={() =>
        iconGlyph === "spinner" ? (
          <AnimatedSpinnerIcon {...iconProps} />
        ) : iconGlyph ? (
          <StyledIcon glyph={iconGlyph} {...iconProps} />
        ) : undefined
      }
      className={"selectableDimensionButton"}
      primary={dim.variant === "primary"}
      secondary={dim.variant === "secondary"}
      warning={dim.variant === "warning"}
      style={{
        backgroundColor: variant === "default" ? "transparent" : undefined
      }}
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
