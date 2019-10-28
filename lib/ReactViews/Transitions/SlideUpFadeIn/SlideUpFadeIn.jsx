import React from "react";
import PropTypes from "prop-types";

import { CSSTransition } from "react-transition-group";

import Styles from "./slide-up-fade-in.scss";

export function SlideUpFadeIn({
  isVisible,
  children,
  onEnter = () => {},
  onExited = () => {}
}) {
  return (
    <CSSTransition
      in={isVisible}
      timeout={300}
      classNames={{ ...Styles }}
      unmountOnExit
      onEnter={onEnter}
      onExited={onExited}
    >
      {children}
    </CSSTransition>
  );
}

SlideUpFadeIn.propTypes = {
  children: PropTypes.node.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onEnter: PropTypes.func,
  onExited: PropTypes.func
};

export default SlideUpFadeIn;
