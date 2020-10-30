/**
 * this workbench button needs a bit of refactoring, heavily nested spans right
 * now with the advent of our "button or link" situation for making terria more
 * route friendly
 */
"use strict";
import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";

// only spans are valid html for buttons (even though divs work)
const ButtonWrapper = styled(Box).attrs({
  as: "span"
})`
  display: flex;
  justify-content: center;
  align-items: center;
`;
// styles half ripped from nav.scss
const StyledWorkbenchButton = styled(Button)`
  border: none;

  border-radius: 3px;
  background: ${props => props.theme.dark};
  color: ${props => props.theme.textLight};
  padding: 0 10px;
  flex-grow: 1;
  margin-right: 10px;

  // height: 32px;
  min-height:32px;
  min-width: 32px;

  box-shadow: none;
  svg {
    height: 16px;
    width: 16px;
    margin: 0 auto;
    ${props => !props.iconOnly && `margin-right: 8px;`};
    vertical-align: middle;
    fill: ${props => props.theme.textLight};
  }

  &:hover,
  &:focus {
    background: ${props => props.theme.colorPrimary};
  }

  // disabled

  ${props =>
    props.disabled &&
    `
    opacity:0.5;
    // background: ${props.theme.textDarker};
    &:hover,
    &:focus {
      cursor: not-allowed;
      background: ${props.theme.dark};
    }
    `}

  ${props =>
    props.primary &&
    `
    background: ${props.theme.colorPrimary};A
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
WorkbenchButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
  primary: PropTypes.bool,
  disabled: PropTypes.bool,
  inverted: PropTypes.bool,
  iconOnly: PropTypes.bool,
  title: PropTypes.string,
  iconElement: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  to: PropTypes.string,
  renderAsLink: PropTypes.bool,
  handleClick: PropTypes.func
};

function WorkbenchButton(props) {
  const {
    children,
    title,
    primary,
    inverted,
    disabled,
    iconOnly,
    to,
    renderAsLink
  } = props;
  const isLink = renderAsLink && to;
  const buttonProps = !isLink && {
    type: "button"
  };
  const linkProps = isLink && {
    renderAsLink: true,
    to: to
  };

  return (
    <StyledWorkbenchButton
      className={props.className}
      primary={primary}
      disabled={disabled}
      iconOnly={iconOnly}
      inverted={inverted}
      title={title}
      onClick={props.onClick}
      {...buttonProps}
      {...linkProps}
    >
      <ButtonWrapper>
        {/* only spans are valid html for buttons (even though divs work) */}
        {props.iconElement && (
          <span
            css={`
              display: block;
            `}
          >
            {props.iconElement()}
          </span>
        )}
        {children && (
          <Text
            as="span"
            noWrap
            small
            css={`
              display: block;
              text-transform: uppercase;
              letter-spacing: 0.08px;
            `}
          >
            {children}
          </Text>
        )}
      </ButtonWrapper>
    </StyledWorkbenchButton>
  );
}
export default WorkbenchButton;
