// <Spacing /> example from terrace

// we'd typically want to avoid this but as the heading and paragraph margins
// are still settling, we will need to use this liberally
import styled from "styled-components";

interface ISpacingProps {
  marginRight?: number;
  marginBottom?: number;
  right?: number;
  bottom?: number;
}

export const Spacing = styled.div<ISpacingProps>`
  // Unsure how to deal with 1px right now
  ${(props) => props.marginRight && `margin-right: ${props.marginRight}px;`}
  ${(props) => props.marginBottom && `margin-bottom: ${props.marginBottom}px;`}

  ${(props) => props.bottom && `margin-bottom: ${props.bottom * 5}px;`}
  ${(props) => props.right && `margin-right: ${props.right * 5}px;`}
`;

export const SpacingSpan = styled(Spacing).attrs({
  as: "span"
})``;

export default Spacing;

// import React from "react";
// import PropTypes from "prop-types";
// // import classNames from "classnames";
// // import Styles from "./text.scss";

// // should it be a span or inline-block-div?
// export const Spacing = props => (
//   <div style={{ marginBottom: `${props.bottom * 5}px` }} />
// );
// Spacing.propTypes = {
//   bottom: PropTypes.number.isRequired
// };

// export default Spacing;
