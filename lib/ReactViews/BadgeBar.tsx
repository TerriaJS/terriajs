import React from "react";
import { TextSpan } from "../Styled/Text";
const Box = require("../Styled/Box").default;

interface IProps {
  label: string;
  badge?: number;
  children: React.ReactNode;
}
const BadgeBar: React.FC<IProps> = (props: IProps) => {
  return (
    <Box paddedHorizontally={3} justifySpaceBetween>
      <Box verticalCenter>
        <TextSpan textLight uppercase>
          {props.label}
        </TextSpan>
        {props.badge && (
          <TextSpan
            textLight
            uppercase
            css={`
              padding-left: 5px;
            `}
          >
            ({props.badge})
          </TextSpan>
        )}
      </Box>

      <Box whiteSpace="nowrap">{props.children}</Box>
    </Box>
  );
};

export default BadgeBar;
