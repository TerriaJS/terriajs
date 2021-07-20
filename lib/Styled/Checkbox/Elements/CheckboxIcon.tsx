import React from "react";
import styled from "styled-components";
import { GLYPHS, StyledIcon } from "../../Icon";
import { CheckboxIconProps } from "../types";

const StyledCheckboxIcon = styled(StyledIcon).attrs({
  styledWidth: "1em"
})<{ disabled?: boolean; labeled: boolean }>`
  ${props => props.labeled && `top: 0.125em;`}
  align-self: flex-start;
  position: relative;
  fill: currentColor;
  ${props =>
    !props.disabled &&
    `
    &:hover {
      opacity: 0.6;
    }
  `}
`;

const CheckboxIcon: React.FC<CheckboxIconProps> = (
  props: CheckboxIconProps
) => {
  if (props.isDisabled) {
    return (
      <StyledCheckboxIcon
        glyph={GLYPHS.checkboxOff}
        labeled={props.labeled}
        disabled
        css={`
          opacity: 0.3;
        `}
      />
    );
  } else if (props.isIndeterminate) {
    return (
      <StyledCheckboxIcon
        labeled={props.labeled}
        glyph={GLYPHS.checkboxIndeterminate}
      />
    );
  } else {
    return (
      <>
        {props.isChecked ? (
          <StyledCheckboxIcon
            labeled={props.labeled}
            glyph={GLYPHS.checkboxOn}
          />
        ) : (
          <StyledCheckboxIcon
            labeled={props.labeled}
            glyph={GLYPHS.checkboxOff}
          />
        )}
      </>
    );
  }
};

export default CheckboxIcon;
