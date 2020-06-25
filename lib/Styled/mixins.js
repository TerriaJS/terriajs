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

export default {
  verticalAlign,
  centerWithoutFlex,
  removeListStyles,
  addBasicHoverStyles
};
