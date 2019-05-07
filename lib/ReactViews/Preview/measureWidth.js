import React from "react";
import debounce from "lodash.debounce";

const getDisplayName = WrappedComponent => {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
};

/*
    HOC to check component width & supply updated widths as a prop (stored interally via state)
    Ensure the wrapped component contains a reference to the element you wish to measure the width of,
    typically the root element. Do this via a callback instead of `React.createRef()` as it was written for pre-react-16.3

    ```js
    ref={component => (this.refToMeasure = component)}>
    ```

    Not yet supported for:
    `React.createRef()` in constructor, then setting via
    ```js
    ref={this.refToMeasure}>
    ```
*/
const measureWidth = WrappedComponent => {
  class MeasureWidth extends React.Component {
    constructor() {
      super();
      this.wrappedComponent = React.createRef();
      this.state = {
        width: null
      };
      this.checkAndUpdateWidth = this.checkAndUpdateWidth.bind(this);
      this.checkAndUpdateWidthWithDebounce = debounce(
        this.checkAndUpdateWidth,
        200
      );
    }
    componentDidMount() {
      window.addEventListener("resize", this.checkAndUpdateWidthWithDebounce);
      this.checkAndUpdateWidth();
    }
    componentDidUpdate() {
      this.checkAndUpdateWidth();
    }
    componentWillUnmount() {
      window.removeEventListener(
        "resize",
        this.checkAndUpdateWidthWithDebounce
      );
    }
    checkAndUpdateWidth() {
      const newWidth =
        (this.wrappedComponent &&
          this.wrappedComponent.current &&
          this.wrappedComponent.current.refToMeasure &&
          this.wrappedComponent.current.refToMeasure.clientWidth) ||
        0;
      // if we haven't already set the width, or if the current width doesn't match the newly rendered width
      if (
        this.wrappedComponent.current &&
        this.wrappedComponent.current.refToMeasure &&
        (!this.state.width || this.state.width !== newWidth)
      ) {
        this.setState({ width: newWidth });
      }
    }
    render() {
      return (
        <WrappedComponent
          {...this.props}
          ref={this.wrappedComponent}
          widthFromMeasureWidthHOC={this.state.width}
        />
      );
    }
  }
  MeasureWidth.displayName = `MeasureWidth(${getDisplayName(
    WrappedComponent
  )})`;
  return MeasureWidth;
};

export default measureWidth;
