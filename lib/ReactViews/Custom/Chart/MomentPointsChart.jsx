import { scaleLinear } from "@vx/scale";
import { Circle } from "@vx/shape";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";
import { computed } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";

const markerRadiusSmall = 2;
const markerRadiusLarge = 5;

@observer
class MomentPointsChart extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    basisItem: PropTypes.object,
    basisItemScales: PropTypes.object,
    scales: PropTypes.object.isRequired
  };

  @computed
  get points() {
    const { chartItem, basisItem, basisItemScales, scales } = this.props;
    if (basisItem) {
      // We want to stick the chartItem points to the basis item, to do this we
      // interpolate the chart item points to match the basis item points. This
      // interpolation should not affect the scale of the chart item points.
      const basisToSourceScale = scaleLinear({
        domain: basisItemScales.y.domain(),
        range: scales.y.domain()
      });
      const interpolatedPoints = chartItem.points.map(p =>
        interpolate(p, basisItem.points, basisToSourceScale)
      );
      return interpolatedPoints;
    }
    return chartItem.points;
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
        dot.setAttribute("opacity", point.isSelected ? 1.0 : 0.3);
      }
    });
  }

  render() {
    const { id, chartItem, scales } = this.props;
    const baseKey = `moment-point-${chartItem.categoryName}-${chartItem.name}`;
    const fillColor = chartItem.getColor();
    const isClickable = chartItem.onClick !== undefined;
    const clickProps = point => {
      if (isClickable) {
        return {
          pointerEvents: "all",
          cursor: "pointer",
          onClick: () => chartItem.onClick(point)
        };
      }
      return {};
    };
    return (
      <g id={id}>
        <For each="p" index="i" of={this.points}>
          <StyledCircle
            key={`${baseKey}-${i}`}
            cx={scales.x(p.x)}
            cy={scales.y(p.y)}
            r={3}
            fill={fillColor}
            opacity={p.isSelected ? 1.0 : 0.3}
            {...clickProps(p)}
          />
        </For>
      </g>
    );
  }
}

const StyledCircle = styled(Circle)`
  &:hover {
    opacity: 1;
    fill: white;
  }
`;

/** Interpolates the given source point {x, y} to the closet point in the `sortedPoints` array.
 *
 * The source point and `sortedBasisPoints` may be of different scale, so we use `basisToSourceScale`
 * to generate a point in the original source items scale.
 */
function interpolate({ x, y }, sortedBasisPoints, basisToSourceScale) {
  const closest = closestPointIndex(x, sortedBasisPoints);
  if (closest === undefined) {
    return { x, y };
  }

  const a = sortedBasisPoints[closest];
  const b = sortedBasisPoints[closest + 1];
  if (a === undefined || b === undefined) {
    return { x, y };
  }

  const xAsPercentage =
    (x.getTime() - a.x.getTime()) / (b.x.getTime() - a.x.getTime());

  const interpolated = {
    x,
    y: d3InterpolateNumber(
      basisToSourceScale(a.y),
      basisToSourceScale(b.y)
    )(xAsPercentage)
  };
  return interpolated;
}

function closestPointIndex(x, sortedPoints) {
  for (let i = 0; i < sortedPoints.length; i++) {
    if (sortedPoints[i].x.getTime() >= x.getTime()) {
      if (i === 0) return 0;
      return i - 1;
    }
  }
  return;
}

export default MomentPointsChart;
