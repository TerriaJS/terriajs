import React from "react";
import { useTheme } from "styled-components";
import { TextSpan } from "../Styled/Text";
const Box = require("../Styled/Box").default;

interface IProps {
  label: string;
  badge?: number;
  children: React.ReactNode;
}
const BadgeBar: React.FC<IProps> = (props: IProps) => {
  const theme = useTheme();
  return (
    <Box
      paddedHorizontally={3}
      justifySpaceBetween
      whiteSpace="nowrap"
      styledMinHeight="40px"
      verticalCenter
      css={`
        border-top: 1px solid ${theme.darkWithOverlay};
        border-bottom: 1px solid ${theme.darkWithOverlay};
      `}
    >
      <TextSpan textLight uppercase overflowHide overflowEllipsis>
        {props.label} {props.badge ? `(${props.badge})` : null}
      </TextSpan>

      <Box
        styledMaxWidth="60%"
        css={`
          gap: 15px;
        `}
      >
        {props.children}
      </Box>
    </Box>
  );
};

export default BadgeBar;
