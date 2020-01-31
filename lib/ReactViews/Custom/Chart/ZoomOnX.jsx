import { observer } from "mobx-react";
import { action, observable, trace } from "mobx";
import { zoom as d3Zoom } from "d3-zoom";
import { select as d3Select, event as d3Event } from "d3-selection";
import PropTypes from "prop-types";
import React from "react";

@observer
class ZoomOnX extends React.Component {
  static propTypes = {
    initialScale: PropTypes.func.isRequired,
    scaleExtent: PropTypes.array.isRequired,
    translateExtent: PropTypes.array.isRequired,
    children: PropTypes.func.isRequired,
    surface: PropTypes.string.isRequired // selector for querying the zoom surface
  };

  @observable zoomedScale;

  constructor(props) {
    super(props);
    this.zoom = d3Zoom()
      .scaleExtent(this.props.scaleExtent)
      .translateExtent(this.props.translateExtent)
      .on("zoom", this.zoomed.bind(this));
  }

  componentDidMount() {
    d3Select(this.props.surface).call(this.zoom);
  }

  @action
  zoomed() {
    this.zoomedScale = d3Event.transform.rescaleX(this.props.initialScale);
  }

  render() {
    return this.props.children(this.zoomedScale || this.props.initialScale);
  }
}

export default ZoomOnX;
