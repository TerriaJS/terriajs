import merge from "lodash/merge";
import { computed } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import {
  combineContainerMixins,
  cursorContainerMixin,
  LineSegment,
  VictoryAxis,
  VictoryContainer,
  VictoryTheme,
  VictoryTooltip,
  voronoiContainerMixin,
  zoomContainerMixin
} from "victory";
import Chart from "./NewChart";

@observer
class BottomDockChart extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    items: PropTypes.array.isRequired
  };

  @computed
  get theme() {
    const fontSize = 10;
    return merge({}, VictoryTheme.grayscale, {
      axis: {
        // Default theme applies to both x & y axes.
        style: {
          axis: {
            stroke: "white"
          },
          axisLabel: {
            fill: "white",
            padding: -15
          },
          grid: {
            stroke: "white",
            strokeWidth: "1px",
            opacity: 0.086
          },
          ticks: {
            stroke: "white",
            size: 5
          },
          tickLabels: {
            fill: "white",
            fontSize,
            padding: 1
          }
        }
      }
    });
  }

  /**
   * Returns a container component configured with the required mixins.
   */
  @computed
  get containerComponent() {
    const mixins = [
      voronoiContainerMixin,
      zoomContainerMixin,
      cursorContainerMixin
    ];
    const Container = combineContainerMixins(mixins, VictoryContainer);

    const getTooltipValue = ({ datum }) => {
      return `${datum.name}: ${datum.y} ${datum.units}`;
    };

    return (
      <Container
        zoomDimension="x"
        cursorDimension="x"
        cursorComponent={
          <LineSegment style={{ stroke: "white", opacity: "0.5" }} />
        }
        labels={getTooltipValue}
        labelComponent={<VictoryTooltip />}
      />
    );
  }

  renderYAxis({ units, color }, i, yAxisCount) {
    const tickCount = Math.min(8, Math.round(this.props.height / 30));
    // If this is the only yAxis, then color it white
    const axisColor = yAxisCount === 1 ? "white" : color;
    return (
      <VictoryAxis
        dependentAxis
        key={i}
        offsetX={50 + i * 50}
        label={units}
        tickCount={tickCount}
        style={{
          axis: { stroke: axisColor },
          axisLabel: { fill: axisColor },
          ticks: { stroke: axisColor },
          tickLabels: { fill: axisColor }
        }}
      />
    );
  }

  render() {
    return (
      <Chart
        width={this.props.width}
        height={this.props.height}
        items={this.props.items}
        theme={this.theme}
        containerComponent={this.containerComponent}
        renderYAxis={this.renderYAxis.bind(this)}
      />
    );
  }
}

export default BottomDockChart;
