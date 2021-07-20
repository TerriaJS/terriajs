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
          {props.label} {props.badge ? `(${props.badge})` : null}
        </TextSpan>
      </Box>

      <Box>{props.children}</Box>
    </Box>
  );
};

export default BadgeBar;
