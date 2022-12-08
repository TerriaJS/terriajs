import React from "react";
import { useTheme } from "styled-components";
import { ButtonProps } from "../../Styled/Button";
import { IconGlyph, StyledIcon } from "../../Styled/Icon";
import StyledButton from "./StyledButton";

export interface ActionButtonProps
  extends Omit<
    ButtonProps & React.HTMLProps<HTMLButtonElement>,
    "iconProps" | "renderIcon"
  > {
  className?: string;
  icon?: IconGlyph;
}

/**
 * A themed button to use inside {@link ActionBar}
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  className,
  icon,
  warning,
  isActive,
  ...props
}) => {
  const theme = useTheme();
  return (
    <StyledButton
      className={className}
      backgroundColor={isActive ? "#DD6E0F" : theme.darkLighter}
      hoverBackgroundColor={warning ? "red" : "#DD6E0F"}
      renderIcon={
        icon
          ? () => (
              <StyledIcon
                light
                styledWidth="20px"
                styledHeight="20px"
                glyph={icon}
              />
            )
          : undefined
      }
      {...(props as any)}
    />
  );
};
