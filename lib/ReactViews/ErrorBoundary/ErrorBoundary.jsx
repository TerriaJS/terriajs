import React from "react";
import PropTypes from "prop-types";
import raiseErrorToUser from "../../Models/raiseErrorToUser";

// https://reactjs.org/docs/error-boundaries.html
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const children = this.props.children;
    const name =
      (children && children.type && children.type.displayName) ||
      children.type.name ||
      "Unnamed Component";
    const errorString = (error.toString && error.toString()) || error;

    this.props.terria.analytics.logEvent(
      "error",
      "boundary",
      name,
      errorString
    );
    raiseErrorToUser(this.props.terria, error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  terria: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};
