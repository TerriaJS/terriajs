import React from "react";
import PropTypes from "prop-types";
import { VictoryScatter, Point } from "victory";
import dateformat from "dateformat";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";

/**
 * Renders moment points.
 * @param {ChartItem} data to render.
 * @param {Int} index of the item
 */
export default function renderMomentPoints(chartItem, chartItems, index) {
  // Find a line item to use for deriving the `y` values of moment points
  const basisItem = chartItems.find(
    item => item.type === "line" && item.xAxis.scale === "time"
  );
  let basisPoints;
  if (basisItem) {
    basisPoints = basisItem.points
      .slice()
      .sort((p1, p2) => p1.x.getTime() - p2.x.getTime());
  }

  const chartItemPoints = chartItem.points.map(p => ({
    ...p,
    ...(basisPoints ? interpolate(p, basisPoints) : { x: p.x, y: 0.5 }),
    units: chartItem.units,
    name: chartItem.name,
    tooltipValue: dateformat(p.x, "dd/mm/yyyy, HH:MMTT")
  }));

  const defaultDataStyle = {
    fill: chartItem.getColor(),
    opacity: ({ datum }) => (datum.isSelected ? 1.0 : 0.3)
  };

  return (
    <VictoryScatter
      key={index}
      data={chartItemPoints}
      dataComponent={
        <MomentPoint
          computeY={({ y, scale }) => {
            return basisPoints ? y : scale.y(scale.y.domain()[1] / 2);
          }}
          computeSize={({ datum }) => (datum.isSelected ? 8 : 5)}
        />
      }
      style={{
        data: defaultDataStyle,
        labels: { fill: chartItem.getColor() }
      }}
      events={[
        {
          target: "data",
          eventHandlers: {
            onMouseOver: updateStyle({ opacity: 1.0 }),
            onMouseOut: updateStyle(defaultDataStyle),
            onClick: (_, props, index) => {
              if (chartItem.onClick) {
                chartItem.onClick(chartItem.points[index]);
              }
            }
          }
        }
      ]}
    />
  );
}

class MomentPoint extends React.Component {
  static propTypes = {
    x: PropTypes.number,
    computeY: PropTypes.func,
    computeSize: PropTypes.func
  };

  render() {
    const { x, computeY, computeSize, ...rest } = this.props;
    return (
      <Point
        {...rest}
        x={x}
        y={computeY(this.props)}
        size={computeSize(this.props)}
      />
    );
  }
}

function updateStyle(newStyle) {
  return () => {
    return [
      {
        target: "data",
        mutation: props => {
          return {
            style: {
              ...props.style,
              ...newStyle
            }
          };
        }
      }
    ];
  };
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
