"use strict";
import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";

// only spans are valid html for buttons (even though divs work)
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
  ${props => props.roundLeft && `border-radius: 16px 0 0 16px;`}
  ${props => props.roundRight && `border-radius: 0 16px 16px 0;`}

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

  ${props =>
    props.primary &&
    `
    background: ${props.theme.colorPrimary};
    color: ${props.theme.textLight};
    svg {
      fill: ${props.theme.textLight};
    }
  `}
  ${props =>
    props.splitter &&
    !props.disabled &&
    `
    background: ${props.theme.colorSplitter};
    color: ${props.theme.textLight};
    svg {
      fill: ${props.theme.textLight};
    }
  `}

  ${props =>
    props.inverted &&
    `
    background: ${props.theme.textDark};
    color: ${props.theme.textLight};
    svg {
      fill: ${props.theme.textLight};
    }
  `}


  ${props =>
    props.disabled &&
    `
    background-color: ${props.theme.grey};
    color: ${props.theme.grey};
    opacity: 0.7;
    svg {
      fill: ${props.theme.textLightDimmed};
    }
  `}
`;
MapIconButton.propTypes = {
  primary: PropTypes.bool,
  splitter: PropTypes.bool,
  inverted: PropTypes.bool,
  expandInPlace: PropTypes.bool,
  neverCollapse: PropTypes.bool,
  roundLeft: PropTypes.bool,
  roundRight: PropTypes.bool,
  title: PropTypes.string,
  iconElement: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  handleClick: PropTypes.func,
  children: PropTypes.node
};

function MapIconButton(props) {
  const [isExpanded, setExpanded] = useState(false);
  const {
    children,
    roundLeft,
    roundRight,
    title,
    expandInPlace,
    neverCollapse,
    primary,
    splitter,
    inverted,
    disabled
  } = props;
  const expanded = (isExpanded || neverCollapse) && children;
  const buttonRef = props.buttonRef || useRef();

  // const handleAway = () => setTimeout(() => setExpanded(false), 1000);
  const handleAway = () => setExpanded(false);
  const handleFocus = bool => {
    if (!disabled) {
      setExpanded(bool);
    }
  };

  const MapIconButtonRaw = (
    <StyledMapIconButton
      ref={buttonRef}
      className={props.className}
      primary={primary}
      splitter={splitter}
      inverted={inverted}
      roundLeft={roundLeft}
      roundRight={roundRight}
      disabled={disabled}
      type="button"
      title={title}
      onMouseOver={() => handleFocus(true)}
      onFocus={() => handleFocus(true)}
      onMouseOut={handleAway}
      onBlur={handleAway}
      // onClick={props.handleClick}
      onClick={props.onClick}
      css={`
        svg {
          margin: 0px 6px;
        }
      `}
    >
      <ButtonWrapper>
        {/* only spans are valid html for buttons (even though divs work) */}
        {children && (
          <Text
            as="span"
            noWrap
            medium
            css={`
              display: block;
              transition: max-width 0.3s ease, margin-right 0.3s ease,
                opacity 0.3s ease;
              max-width: ${expanded ? `150px` : `0px`};
              margin-right: ${expanded ? `10px` : `0px`};
              opacity: ${expanded ? `1.0` : `0`};
            `}
          >
            {children}
          </Text>
        )}
        {props.iconElement && (
          <span
            css={`
              display: block;
            `}
          >
            {props.iconElement()}
          </span>
        )}
      </ButtonWrapper>
    </StyledMapIconButton>
  );
  // we need to add some positional wrapping elements if we need to expand the
  // button in place (`absolute`ly) instead of in the layout flow (`relative`).
  if (expandInPlace) {
    return (
      <div
        css={
          expandInPlace &&
          `
            position:relative;
            width: 32px;
            height: 32px;
            margin:auto;
          `
        }
      >
        <div
          css={
            expandInPlace &&
            `
              position:absolute;
              top:0;
              right:0;
              ${isExpanded && `z-index:10;`}
            `
          }
        >
          {MapIconButtonRaw}
        </div>
      </div>
    );
  } else return MapIconButtonRaw;
}

// const MapIconButtonWithRef = (props, ref) => (
//   <MapIconButton {...props} buttonRef={ref} />
// );

// export default React.forwardRef(MapIconButtonWithRef);

export default MapIconButton;
