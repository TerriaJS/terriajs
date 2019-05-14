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
const measureComponent = WrappedComponent => {
  class MeasureComponent extends React.Component {
    constructor() {
      super();
      this.wrappedComponent = React.createRef();
      this.state = {
        width: null,
        height: null
      };
      this.checkAndUpdateSizing = this.checkAndUpdateSizing.bind(this);
      this.checkAndUpdateSizingWithDebounce = debounce(
        this.checkAndUpdateSizing,
        200
      );
    }
    componentDidMount() {
      window.addEventListener("resize", this.checkAndUpdateSizingWithDebounce);
      this.checkAndUpdateSizing();
    }
    componentDidUpdate() {
      this.checkAndUpdateSizing();
    }
    componentWillUnmount() {
      window.removeEventListener(
        "resize",
        this.checkAndUpdateSizingWithDebounce
      );
    }
    checkAndUpdateSizing() {
      const refToUse = this.wrappedComponent.current.refToMeasure;
      const widthFromRef = refToUse
        ? refToUse.current
          ? refToUse.current.clientWidth
          : refToUse.clientWidth
        : undefined;
      const heightFromRef = refToUse
        ? refToUse.current
          ? refToUse.current.clientHeight
          : refToUse.clientHeight
        : undefined;
      const newWidth = widthFromRef || 0;
      const newHeight = heightFromRef || 0;
      if (!widthFromRef || !heightFromRef)
        console.warn("measureComponent was used without a ref to measure");
      // not sure if we warn on height = 0?
      if (newWidth === 0 || newHeight === 0)
        console.warn("measureComponent has a reading of 0");

      // if we haven't already set the width, or if the current width doesn't match the newly rendered width
      if (
        this.wrappedComponent.current &&
        this.wrappedComponent.current.refToMeasure
      ) {
        if (
          !this.state.height ||
          !this.state.width ||
          this.state.height !== newHeight ||
          this.state.width !== newWidth
        ) {
          this.setState({ width: newWidth, height: newHeight });
        }
      }
    }
    render() {
      return (
        <WrappedComponent
          {...this.props}
          ref={this.wrappedComponent}
          widthFromMeasureComponentHOC={this.state.width}
          heightFromMeasureComponentHOC={this.state.height}
        />
      );
    }
  }
  MeasureComponent.displayName = `MeasureComponent(${getDisplayName(
    WrappedComponent
  )})`;
  return MeasureComponent;
};

export default measureComponent;
