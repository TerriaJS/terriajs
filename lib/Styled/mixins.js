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

export default {
  verticalAlign,
  centerWithoutFlex
};
