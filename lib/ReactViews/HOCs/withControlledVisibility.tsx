import React from "react";
import PropTypes from "prop-types";

import IElementConfig from "../../Models/IElementsConfig";

interface WithControlledVisibilityProps {
  elementConfig: IElementConfig;
}

/**
 * Higher-order component that hides element, depending on whether
 * element is available inside either "hidden" or "shown" lists passed
 * as prop
 */
export default <P extends React.ComponentProps<any>>(
  WrappedComponent: React.ComponentClass<P> | React.FunctionComponent<P>
) => {
  // eslint-disable-next-line require-jsdoc
  function WithControlledVisibility({
    elementConfig,
    ...props
  }: P & WithControlledVisibilityProps & any) {
    const isVisible = elementConfig ? elementConfig.visible : true;
    return isVisible ? <WrappedComponent {...props} /> : null;
  }

  WithControlledVisibility.propTypes = {
    elementConfig: PropTypes.object
  };

  return WithControlledVisibility;
};
