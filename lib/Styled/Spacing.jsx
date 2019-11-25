// <Spacing /> example from terrace
// import styled from "styled-components";

// interface SpacingProps {
//   bottom?: number; // going off "new 4 unit design"
// }

// export const Spacing = styled.div<SpacingProps>`
//   ${props => props.bottom && `margin-bottom: ${props.bottom * 4}px;`}
// `;

// export default Spacing;

import React from "react";
import PropTypes from "prop-types";
// import classNames from "classnames";
// import Styles from "./text.scss";

// should it be a span or inline-block-div?
export const Spacing = props => (
  <div style={{ marginBottom: `${props.bottom * 4}px` }} />
);
Spacing.propTypes = {
  bottom: PropTypes.number.isRequired
};

export default Spacing;
