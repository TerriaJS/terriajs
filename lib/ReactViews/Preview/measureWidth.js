import React from "react";
import debounce from "lodash.debounce";

const getDisplayName = WrappedComponent => {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
};

/*
    HOC to check component width & supply updated widths as a prop (stored interally via state)
    Ensure the wrapped component contains a reference to the element you wish to measure the width of,
    typically the root element.

    Set the ref via a callback ref
    ```js
    ref={component => (this.refToMeasure = component)}>
    ```
    
    or

    Set the ref via createRef
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
      const refToUse = this.wrappedComponent.current.refToMeasure;
      const widthFromRef = refToUse
        ? refToUse.current
          ? refToUse.current.clientWidth
          : refToUse.clientWidth
        : undefined;
      const newWidth = widthFromRef || 0;
      if (!widthFromRef)
        console.warn("measureWidth was used without a ref to measure");
      if (newWidth === 0) console.warn("measureWidth has a reading of 0");

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
