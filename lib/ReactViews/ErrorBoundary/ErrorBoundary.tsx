import React, { ErrorInfo } from "react";
import PropTypes from "prop-types";
import Terria from "../../Models/Terria";

interface IProps {
  terria: Terria;
}

// https://reactjs.org/docs/error-boundaries.html
export default class ErrorBoundary extends React.Component<
  IProps,
  { hasError: boolean }
> {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired
  };
  constructor(props: IProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    let name = "Unnamed Component";
    try {
      const children = this.props.children as any;
      name = children.type.displayName || children.type.name;
    } catch {}
    const errorString = `${error} in ${name}`;

    this.props.terria.analytics?.logEvent(
      "error",
      "boundary",
      name,
      errorString
    );
    this.props.terria.raiseErrorToUser(error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
