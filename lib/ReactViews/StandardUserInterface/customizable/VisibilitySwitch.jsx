import React from "react";

import PropTypes from "prop-types";

/**
 * Higher-order component that hides element, depending on whether
 * element is available inside either "hidden" or "shown" lists passed
 * as prop
 */
export default Component => {
  // eslint-disable-next-line require-jsdoc
  function VisibilitySwitch(props) {
    const isVisible = props.elementConfig ? props.elementConfig.visible : true;
    return isVisible ? <Component {...props} /> : null;
  }

  VisibilitySwitch.propTypes = {
    elementConfig: PropTypes.object
  };

  return VisibilitySwitch;
};
