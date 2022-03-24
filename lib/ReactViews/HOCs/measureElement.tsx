import React from "react";
import debounce from "lodash-es/debounce";
import Constructor from "../../Core/Constructor";

const getDisplayName = (WrappedComponent: any) => {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
};

interface State {
  width: number;
  height: number;
}

/*
    HOC to check component width & supply updated widths as a prop (stored interally via state)
    Ensure the wrapped component contains a reference to the element you wish to measure the width of,
    typically the root element - ensure the ref is a HTML element and not a custom class component,
    as we want to use the DOM API

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
const measureElement = function<P>(
  WrappedComponent: React.ComponentType<P>,
  verbose = true
): Constructor<React.Component<
  Omit<P, "heightFromMeasureElementHOC" | "widthFromMeasureElementHOC">
>> {
  class MeasureElement extends React.Component<P, State> {
    wrappedComponent: React.RefObject<{
      refToMeasure: any;
    }>;
    checkAndUpdateSizingWithDebounce: () => void;

    constructor(props: P) {
      super(props);
      this.wrappedComponent = React.createRef();
      this.state = {
        width: 0,
        height: 0
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
      if (!this.wrappedComponent.current) {
        return;
      }
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
      if (verbose) {
        if (!widthFromRef || !heightFromRef)
          console.warn("measureElement was used without a ref to measure");
        // not sure if we warn on height = 0?
        if (newWidth === 0 || newHeight === 0)
          console.warn("measureElement has a reading of 0");
      }

      // if we haven't already set the width, or if the current width doesn't match the newly rendered width
      if (
        this.wrappedComponent.current &&
        this.wrappedComponent.current.refToMeasure
      ) {
        if (
          // if we get into a null state this has a path of setting infinitely(?)
          // !this.state.height ||
          // !this.state.width ||
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
          widthFromMeasureElementHOC={this.state.width}
          heightFromMeasureElementHOC={this.state.height}
        />
      );
    }
  }
  (MeasureElement as any).displayName = `MeasureElement(${getDisplayName(
    WrappedComponent
  )})`;
  return MeasureElement;
};

export default measureElement;
