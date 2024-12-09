import { observer } from "mobx-react";
// @ts-expect-error TS(7016): Could not find a declaration file for module 'd3-z... Remove this comment to see the full error message
import { zoom as d3Zoom } from "d3-zoom";
import { select as d3Select } from "d3-selection";
import PropTypes from "prop-types";
import React from "react";

@observer
class ZoomX extends React.Component {
  static propTypes = {
    initialScale: PropTypes.func.isRequired,
    scaleExtent: PropTypes.array.isRequired,
    translateExtent: PropTypes.array.isRequired,
    children: PropTypes.node,
    onZoom: PropTypes.func.isRequired,
    surface: PropTypes.string.isRequired // selector for querying the zoom surface
  };

  zoom: any;

  constructor(props: any) {
    super(props);
    this.zoom = d3Zoom()
      .scaleExtent(props.scaleExtent)
      .translateExtent(props.translateExtent)
      .on("zoom", (event: any) => {
        // @ts-expect-error TS(2339): Property 'initialScale' does not exist on type 'Re... Remove this comment to see the full error message
        props.onZoom(event.transform.rescaleX(this.props.initialScale));
      });
  }

  componentDidMount() {
    // @ts-expect-error TS(2339): Property 'surface' does not exist on type 'Readonl... Remove this comment to see the full error message
    d3Select(this.props.surface).call(this.zoom);
  }

  render() {
    return this.props.children;
  }
}

export default ZoomX;
