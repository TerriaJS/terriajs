import PropTypes from "prop-types";
import React from "react";
import { VictoryScatter, Bar } from "victory";
import dateformat from "dateformat";

/**
 * Renders moment lines.
 * @param {ChartItem} data to render.
 * @param {Int} index of the item
 */
export default function renderMomentLines(data, index) {
  const selectedColor = "orange";
  const defaultDataStyle = {
    fill: ({ datum }) => (datum.isSelected ? selectedColor : data.getColor()),
    opacity: ({ datum }) => (datum.isSelected ? 1.0 : 0.3),
    strokeWidth: 5,
    stroke: "transparent"
  };
  return (
    <VictoryScatter
      key={index}
      domain={{ y: [0, 1] }}
      data={data.points.map(p => ({
        ...p,
        y: 0.5,
        units: data.units,
        name: data.name,
        tooltipValue: dateformat(p.x, "dd/mm/yyyy, HH:MMTT")
      }))}
      dataComponent={<MomentLine />}
      style={{
        data: defaultDataStyle,
        labels: { fill: data.getColor() }
      }}
      events={[
        {
          target: "data",
          eventHandlers: {
            onMouseOver: updateStyle({ opacity: 1.0 }),
            onMouseOut: updateStyle(defaultDataStyle),
            onClick: (_, props, index) => {
              if (data.onClick) {
                data.onClick(data.points[index]);
              }
            }
          }
        }
      ]}
    />
  );
}

class MomentLine extends React.Component {
  static propTypes = {
    x: PropTypes.number,
    y: PropTypes.number
  };

  render() {
    const { x, y, ...rest } = this.props;
    return <Bar {...rest} x={x} y={y * 10} y0={0} barWidth={2} />;
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
