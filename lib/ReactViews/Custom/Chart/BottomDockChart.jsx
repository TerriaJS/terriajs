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
        style: {
          axis: {
            stroke: "white"
          },
          axisLabel: {
            fill: "white"
          },
          grid: {
            stroke: "white",
            strokeWidth: "1px",
            opacity: 0.086
          },
          ticks: {
            size: 5,
            stroke: "white"
          },
          tickLabels: {
            fill: "white",
            fontSize
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
      const name = datum.childName.split(":")[1];
      return `${name}: ${datum.y}`;
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

  renderYAxis(label, i) {
    const tickCount = Math.min(8, Math.round(this.props.height / 30));
    return (
      <VictoryAxis dependentAxis key={i} label={label} tickCount={tickCount} />
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
