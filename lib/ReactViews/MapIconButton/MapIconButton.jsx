"use strict";
import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";

const ButtonWrapper = styled(Box).attrs({
  as: "span"
})`
  display: flex;
  justify-content: center;
  align-items: center;
  transition: flex 0.3s ease-out;
`;
// styles half ripped from nav.scss
const StyledMapIconButton = styled(RawButton)`
  border-radius: 16px;
  background: #fff;
  color: ${props => props.theme.textDarker};
  height: 32px;
  min-width: 32px;
  direction: rtl;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.15);
  svg {
    height: 20px;
    width: 20px;
    margin: 0 auto;
    vertical-align: middle;
    fill: ${props => props.theme.textDarker};
  }
`;
MapIconButton.propTypes = {
  buttonText: PropTypes.string,
  iconElement: PropTypes.element,
  handleClick: PropTypes.func
};

function MapIconButton(props) {
  const [isExpanded, setExpanded] = useState(false);
  const buttonText = props.buttonText;
  const expanded = isExpanded && buttonText;
  // const { t } = this.props;

  // const IconElement = props.iconElement;
  // const handleAway = () => setTimeout(() => setExpanded(false), 1000);
  const handleAway = () => setExpanded(false);
  return (
    <div
      // onMouseOut={() => setExpanded(false)}
      onMouseOut={handleAway}
      onBlur={handleAway}
    >
      <StyledMapIconButton
        type="button"
        onMouseOver={() => setExpanded(true)}
        onFocus={() => setExpanded(true)}
        onClick={props.handleClick}
        css={`
          svg {
            ${expanded && `margin-left: 6px;`};
          }
        `}
      >
        <ButtonWrapper>
          {buttonText && (
            <Text
              css={`
                display: block;
                transition: transform 100ms;
                margin: ${expanded ? `0 10px 0 8px` : `0`};
                flex-grow: ${expanded ? `1` : `0.0001`};
                transform: scale(${expanded ? `1, 1` : `0, 1`});
              `}
            >
              {expanded && props.buttonText}
              {/* {props.buttonText} */}
            </Text>
          )}
          {props.iconElement && (
            <span
              css={`
                display: block;
                flex-grow: 1;
                transition: flex-grow 200ms;
              `}
            >
              {props.iconElement()}
            </span>
          )}
        </ButtonWrapper>
      </StyledMapIconButton>
    </div>
  );
}
export default MapIconButton;
