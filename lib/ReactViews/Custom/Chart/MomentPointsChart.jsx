import { observer } from "mobx-react";
import { computed } from "mobx";
import { Circle } from "@vx/shape";
import PropTypes from "prop-types";
import React from "react";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";

const markerRadiusSmall = 2;
const markerRadiusLarge = 5;

@observer
class MomentPointsChart extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    basisItem: PropTypes.object,
    scales: PropTypes.object.isRequired
  };

  @computed
  get points() {
    const { chartItem, basisItem } = this.props;
    const f = basisItem
      ? p => ({ ...p, ...interpolate(p, basisItem.points) })
      : p => ({ ...p, y: 0.5 });
    return chartItem.points.map(f);
  }

  doZoom(scales) {
    const points = this.props.chartItem.points;
    if (points.length === 0) return;
    const n = points.length;
    const spacing = (scales.x(points[n - 1].x) - scales.x(points[0].x)) / n;
    const dots = document.querySelectorAll(`g#${this.props.id} circle`);
    dots.forEach((dot, i) => {
      const point = points[i];
      if (point) {
        const radius =
          (spacing <= markerRadiusSmall
            ? markerRadiusSmall
            : markerRadiusLarge) + (point.isSelected ? 3 : 0);
        dot.setAttribute("cx", scales.x(point.x));
        dot.setAttribute("r", radius);
      }
    });
  }

  render() {
    const { id, chartItem, scales } = this.props;
    const baseKey = `moment-point-${chartItem.categoryName}-${chartItem.name}`;
    const fillColor = chartItem.getColor();
    return (
      <g id={id}>
        <For each="p" index="i" of={this.points}>
          <Circle
            key={`${baseKey}-${i}`}
            cx={scales.x(p.x)}
            cy={scales.y(p.y)}
            r={3}
            fill={fillColor}
            opacity={p.isSelected ? 1.0 : 0.3}
            pointerEvents="all"
            cursor="pointer"
            onClick={() => chartItem.onClick(p)}
          />
        </For>
      </g>
    );
  }
}

function interpolate({ x, y }, sortedPoints) {
  const closest = closestPointIndex(x, sortedPoints);
  if (closest === null) return { x, y };

  const a = sortedPoints[closest];
  const b = sortedPoints[closest + 1];

  const xAsPercentage =
    (x.getTime() - a.x.getTime()) / (b.x.getTime() - a.x.getTime());

  const interpolated = { x, y: d3InterpolateNumber(a.y, b.y)(xAsPercentage) };
  return interpolated;
}

function closestPointIndex(x, sortedPoints) {
  for (let i = 0; i <= sortedPoints.length - 2; i++) {
    if (sortedPoints[i].x.getTime() >= x.getTime()) {
      if (i === 0) break;
      return i - 1;
    }
  }
  return null;
}

export default MomentPointsChart;
