import React from "react";
import styled, { useTheme } from "styled-components";
import {
  Box,
  Button as _Button,
  IconGlyph,
  StyledIcon
} from "terriajs-plugin-api";
import { ButtonProps } from "terriajs/lib/Styled/Button";

export interface ActionButtonProps
  extends Omit<
    ButtonProps & React.HTMLProps<HTMLButtonElement>,
    "iconProps" | "renderIcon"
  > {
  icon?: IconGlyph;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  warning,
  isActive,
  ...props
}) => {
  const theme = useTheme();
  return (
    <Button
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

const Button = styled(_Button)<{
  backgroundColor: string;
  hoverBackgroundColor?: string;
}>`
  background-color: ${(props) => props.backgroundColor};
  color: ${(props) => props.theme.textLight};
  border: 1px solid ${(props) => props.theme.darkLighter};

  margin-right: 8px;
  &:first-child {
    margin-left: 8px;
  }

  ${(props) =>
    props.hoverBackgroundColor &&
    `&:hover { background-color: ${props.hoverBackgroundColor} }`}
`;

export const ActionButtonGroup = styled(Box)`
  margin-right: 8px;

  ${Button} {
    margin-right: 0;
  }

  ${Button}:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  ${Button}:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

export default ActionButton;
