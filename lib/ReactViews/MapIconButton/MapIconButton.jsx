"use strict";
import React, { useState } from "react";
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
    background: ${props.theme.textDarker};
    color: ${props.theme.textLight};
    svg {
      fill: ${props.theme.textLight};
    }
  `}
`;
MapIconButton.propTypes = {
  primary: PropTypes.bool,
  splitter: PropTypes.bool,
  inverted: PropTypes.bool,
  expandInPlace: PropTypes.bool,
  neverCollapse: PropTypes.bool,
  title: PropTypes.string,
  iconElement: PropTypes.element.isRequired,
  onClick: PropTypes.func,
  handleClick: PropTypes.func
};

function MapIconButton(props) {
  const [isExpanded, setExpanded] = useState(false);
  const {
    children,
    title,
    expandInPlace,
    neverCollapse,
    primary,
    splitter,
    inverted
  } = props;
  const expanded = (isExpanded || neverCollapse) && children;
  // const { t } = this.props;

  // const handleAway = () => setTimeout(() => setExpanded(false), 1000);
  const handleAway = () => setExpanded(false);

  const MapIconButtonRaw = (
    <StyledMapIconButton
      className={props.className}
      primary={primary}
      splitter={splitter}
      inverted={inverted}
      type="button"
      title={title}
      onMouseOver={() => setExpanded(true)}
      onFocus={() => setExpanded(true)}
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
              transition: all 0.5s ease;
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
export default MapIconButton;
