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
  &:hover,
  &:focus {
    color: ${props.theme.textLight};
    background: ${props.theme.colorPrimary};
  }
`;

export const addTerriaSecondaryBtnStyles = props => `
  color: ${props.theme.colorPrimary};
  // Don't override border here on secondary, as it's set specifically on certain buttons e.g. story cancel button

  &:hover,
  &:focus {
    border: 2px solid ${props.theme.colorPrimary};
    color: ${props.theme.colorPrimary};
  }
  ${addBasicHoverStyles()}
`;

export const addTerriaTertiaryBtnStyles = props => `
  color: ${props.theme.modalText};
  background: ${props.theme.modalBg};
  border: 2px solid ${props.theme.modalText};

  &:hover,
  &:focus {
    border: 2px solid ${props.theme.colorPrimary};
    color: ${props.theme.colorPrimary};
  }
`;

export const addTerriaMapBtnStyles = props => `
  color: ${props.theme.textLight};
  background-color: ${props.theme.dark};
  &:hover,
  &:focus,
  .is-open &,
  &.is-active {
    background: ${props.theme.colorPrimary};
  }
  svg {
    fill: ${props.theme.mapButtonColor};
  }
  &:hover,
  &:focus {
    svg {
      fill: ${props.theme.textLight};
    }
  }
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
  addTerriaTertiaryBtnStyles,
  addTerriaMapBtnStyles,
  addTerriaLightBtnStyles
};
