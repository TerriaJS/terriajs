import { LinePath } from "@visx/shape";
import { line } from "d3-shape";
import PropTypes from "prop-types";
import React from "react";
import { observer } from "mobx-react";

@observer
class LineChart extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    scales: PropTypes.object.isRequired,
    color: PropTypes.string
  };

  doZoom(scales: any) {
    // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
    const el = document.querySelector(`#${this.props.id} path`);
    if (!el) return;
    // @ts-expect-error TS(2339): Property 'chartItem' does not exist on type 'Reado... Remove this comment to see the full error message
    const { chartItem } = this.props;
    const path = line()
      // @ts-expect-error TS(2339): Property 'x' does not exist on type '[number, numb... Remove this comment to see the full error message
      .x((p) => scales.x(p.x))
      // @ts-expect-error TS(2339): Property 'y' does not exist on type '[number, numb... Remove this comment to see the full error message
      .y((p) => scales.y(p.y));
    // @ts-expect-error TS(2769): No overload matches this call.
    el.setAttribute("d", path(chartItem.points));
  }

  render() {
    // @ts-expect-error TS(2339): Property 'chartItem' does not exist on type 'Reado... Remove this comment to see the full error message
    const { chartItem, scales, color } = this.props;
    const stroke = color || chartItem.getColor();
    return (
      // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
      <g id={this.props.id}>
        <LinePath
          data={chartItem.points}
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          x={(p) => scales.x(p.x)}
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          y={(p) => scales.y(p.y)}
          stroke={stroke}
          strokeWidth={2}
        />
      </g>
    );
  }
}

export default LineChart;
