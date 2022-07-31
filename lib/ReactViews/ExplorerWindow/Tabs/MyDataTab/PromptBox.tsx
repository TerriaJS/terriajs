import React, { FC } from "react";

import { useTheme } from "styled-components";

import Box, { IBoxProps } from "../../../../Styled/Box";
import { StyledIcon, GLYPHS } from "../../../../Styled/Icon";

export const PromptBox: FC<IBoxProps> = ({ children, ...rest }) => {
  const theme = useTheme();

  return (
    <Box
      fullWidth
      fullHeight
      rounded
      centered
      column
      css={`
        border: 2px dashed ${theme.greyLighter};
      `}
      {...rest}
    >
      <StyledIcon
        glyph={GLYPHS.upload}
        fillColor={theme.greyLighter}
        styledHeight="50px"
      />
      {children}
    </Box>
  );
};
