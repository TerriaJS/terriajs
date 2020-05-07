/**
 * sample usage:
 * 

<Select>
  <option>one</option>
  <option>two</option>
  <option>three</option>
</Select>

or if you need padding, box needed as select comes with zero padding
<Box paddedRatio={1}>
  <Select>
    <option>one</option>
    <option>two</option>
    <option>three</option>
  </Select>
</Box>

or with overrides on icon
<Select dropdownIconProps={{fillColor: props.theme.textLight}}>
  <option>one</option>
  <option>two</option>
  <option>three</option>
</Select>
 */

import React from "react";
import PropTypes from "prop-types";
import styled, { useTheme } from "styled-components";
import Box from "./Box";
import Icon, { StyledIcon } from "../ReactViews/Icon";

const StyledSelect = styled.select`
  -moz-appearance: none;
  -webkit-appearance: none;

  min-height: 34px; // use a bool prop when we figure out the smaller size
  width: 100%;

  border: none;
  border-radius: ${p => p.theme.radiusSmall};
  padding-left: 10px;
  padding-right: 30px; // For icon

  color: ${p => p.theme.textLight};
  background: ${p => p.theme.overlay};

  & option {
    color: ${p => p.theme.textBlack};
  }

  ${props =>
    props.light &&
    `
    color: ${props.theme.textBlack};
    background: ${props.theme.overlayInvert};
  `}

  ${props => props.disabled && `opacity: 0.3;`}
`;

const ArrowPositioning = styled.div`
  ${props => props.theme.verticalAlign("absolute")}
  right: 10px;
`;

const Select = props => {
  const { children, boxProps, dropdownIconProps, ...rest } = props;
  const theme = useTheme();
  return (
    <Box fullWidth {...boxProps}>
      <StyledSelect {...rest}>{children}</StyledSelect>
      <ArrowPositioning>
        <StyledIcon
          // light bg needs dark icon
          fillColor={props.light ? theme.textBlack : theme.textLight}
          styledWidth="16px"
          glyph={Icon.GLYPHS.arrowDown}
          {...dropdownIconProps}
        />
      </ArrowPositioning>
    </Box>
  );
};

Select.propTypes = {
  children: PropTypes.node,
  light: PropTypes.bool,
  boxProps: PropTypes.object,
  dropdownIconProps: PropTypes.object
};

export default Select;
