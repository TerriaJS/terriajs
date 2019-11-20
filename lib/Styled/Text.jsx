import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Styles from "./text.scss";

// should it be a span or inline-block-div?
export const Text = props => (
  <div
    className={classNames(Styles.text, {
      [Styles.medium]: props.medium,
      [Styles.bold]: props.bold
    })}
  >
    {props.children}
  </div>
);

Text.propTypes = {
  medium: PropTypes.bool,
  bold: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default Text;
