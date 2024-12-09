import { observer } from "mobx-react";
import { Line } from "@visx/shape";
import PropTypes from "prop-types";
import React from "react";

@observer
class MomentLines extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    scales: PropTypes.object.isRequired
  };

  doZoom(scales: any) {
    // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
    const lines = document.querySelectorAll(`g#${this.props.id} line`);
    lines.forEach((line, i) => {
      // @ts-expect-error TS(2339): Property 'chartItem' does not exist on type 'Reado... Remove this comment to see the full error message
      const point = this.props.chartItem.points[i];
      if (point) {
        const x = scales.x(point.x);
        line.setAttribute("x1", x);
        line.setAttribute("x2", x);
      }
    });
  }

  render() {
    // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
    const { id, chartItem, scales } = this.props;
    const baseKey = `moment-line-${chartItem.categoryName}-${chartItem.name}`;
    return (
      <g id={id}>
        {chartItem.points.map((p: any, i: any) => {
          const x = scales.x(p.x);
          const y = scales.y(0);
          return (
            <Line
              key={`${baseKey}-${i}`}
              from={{ x, y: 0 }}
              to={{ x, y }}
              stroke={chartItem.getColor()}
              strokeWidth={3}
              opacity={p.isSelected ? 1.0 : 0.3}
              pointerEvents="all"
              cursor="pointer"
              onClick={() => chartItem.onClick(p)}
            />
          );
        })}
      </g>
    );
  }
}

export default MomentLines;
