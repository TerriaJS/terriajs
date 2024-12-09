import React from "react";
import PropTypes from "prop-types";
import interact from "interactjs";

class DragWrapper extends React.Component {
  node: any;
  resizeListener: any;
  constructor(props: any) {
    super(props);
    this.resizeListener = null;
  }

  componentDidMount() {
    const node = this.node;

    const dragMoveListener = (event: any) => {
      const target = event.target;
      // keep the dragged position in the data-x/data-y attributes
      const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
      const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

      // translate the element
      target.style.webkitTransform = target.style.transform =
        "translate(" + x + "px, " + y + "px)";

      // update the posiion attributes
      target.setAttribute("data-x", x);
      target.setAttribute("data-y", y);
    };

    interact(node).draggable({
      ignoreFrom: "button",
      allowFrom: ".drag-handle",
      inertia: true,
      onmove: dragMoveListener,
      // keep the element within the area of it's parent
      restrict: {
        restriction: "parent",
        endOnly: true,
        elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
      }
    });

    this.resizeListener = () => {
      const draggable = interact(node);
      const dragEvent = { name: "drag", axis: "xy" };
      // @ts-expect-error TS(2339): Property 'reflow' does not exist on type 'Interact... Remove this comment to see the full error message
      draggable.reflow(dragEvent);
    };
    window.addEventListener("resize", this.resizeListener, false);
  }

  componentWillUnmount() {
    if (interact.isSet(this.node)) {
      interact(this.node).unset();
    }
    window.removeEventListener("resize", this.resizeListener, false);
  }

  render() {
    return <div ref={(node) => (this.node = node)}>{this.props.children}</div>;
  }
}

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
DragWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default DragWrapper;
