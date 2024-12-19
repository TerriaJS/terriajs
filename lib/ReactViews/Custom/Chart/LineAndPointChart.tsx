import PropTypes from "prop-types";
import React from "react";
import LineChart from "./LineChart";
import MomentPointsChart from "./MomentPointsChart";

/**
 * A line chart, where each data point is represented by a circle, and a line is
 * drawn between each point.
 */
export default class LineAndPointChart extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    scales: PropTypes.object.isRequired,
    color: PropTypes.string,
    glyph: PropTypes.string
  };

  lineRef: any;
  pointRef: any;

  constructor() {
    // @ts-expect-error TS(2554): Expected 1-2 arguments, but got 0.
    super();
    this.lineRef = React.createRef();
    this.pointRef = React.createRef();
  }

  doZoom(scales: any) {
    this.lineRef.current.doZoom(scales);
    this.pointRef.current.doZoom(scales);
  }

  render() {
    return (
      <>
        <LineChart
          ref={this.lineRef}
          // @ts-expect-error TS(2339): Property 'chartItem' does not exist on type 'Reado... Remove this comment to see the full error message
          chartItem={this.props.chartItem}
          // @ts-expect-error TS(2339): Property 'scales' does not exist on type 'Readonly... Remove this comment to see the full error message
          scales={this.props.scales}
          // @ts-expect-error TS(2339): Property 'color' does not exist on type 'Readonly<... Remove this comment to see the full error message
          color={this.props.color}
          // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
          id={this.props.id + "-line"}
        />
        <MomentPointsChart
          ref={this.pointRef}
          // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
          id={this.props.id + "-point"}
          // @ts-expect-error TS(2339): Property 'chartItem' does not exist on type 'Reado... Remove this comment to see the full error message
          chartItem={this.props.chartItem}
          // @ts-expect-error TS(2339): Property 'scales' does not exist on type 'Readonly... Remove this comment to see the full error message
          scales={this.props.scales}
          // @ts-expect-error TS(2339): Property 'glyph' does not exist on type 'Readonly<... Remove this comment to see the full error message
          glyph={this.props.glyph}
        />
      </>
    );
  }
}
