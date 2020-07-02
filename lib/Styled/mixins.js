// Doesn't result in composed classes that reuse these, but to save some typing

export const verticalAlign = (position = "relative") => `
  position: ${position};
  top: 50%;
  transform: translateY(-50%);
`;

export const centerWithoutFlex = () => `
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export const removeListStyles = () => `
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const addBasicHoverStyles = () => `
  &:hover, &:focus {
    opacity: 0.9;
  }
`;

/**
 * Use these for inline css props until we fix all the terria buttons
 * unfortunately this means more classnames outputted, but gives us consistency
 * in the meantime.
 *  */
export const addTerriaPrimaryBtnStyles = props => `
  background: ${props.theme.colorPrimary};
  color: ${props.theme.textLight};
  svg {
    fill: ${props.theme.textLight};
  }
  ${addBasicHoverStyles()}
`;

export const addTerriaSecondaryBtnStyles = props => `
  background: ${props.theme.colorPrimary};
  color: ${props.theme.textLight};
  svg {
    fill: ${props.theme.textLight};
  }
  ${addBasicHoverStyles()}
`;

export const addTerriaLightBtnStyles = props => `
  color: ${props.theme.textLight};
  svg {
    fill: ${props.theme.textLight};
  }
  &:hover, &:focus {
    svg {
      fill: ${props.theme.colorPrimary};
    }
  }
`;

export default {
  verticalAlign,
  centerWithoutFlex,
  removeListStyles,
  addBasicHoverStyles,
  addTerriaPrimaryBtnStyles,
  addTerriaSecondaryBtnStyles,
  addTerriaLightBtnStyles
};
