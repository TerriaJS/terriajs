import React from "react";
import { useTheme } from "styled-components";
import { GLYPHS, StyledIcon } from "../../Icon";

const BoxSpan: any = require("../../../Styled/Box").BoxSpan;
const Button: any = require("../../../Styled/Button").default;
const TextSpan: any = require("../../../Styled/Text").TextSpan;

const BackButton: React.FC<{ onClick: () => void }> = ({
  children,
  onClick
}) => {
  const theme = useTheme();
  return (
    <Button
      css={`
        color: ${theme.textLight};
        border-color: ${theme.textLight};
        margin: 2em 0 1em 0;
      `}
      transparentBg
      onClick={onClick}
    >
      <BoxSpan centered>
        <StyledIcon
          css="transform:rotate(90deg);"
          light
          styledWidth="16px"
          glyph={GLYPHS.arrowDown}
        />
        <TextSpan noFontSize>{children}</TextSpan>
      </BoxSpan>
    </Button>
  );
};

export default BackButton;
