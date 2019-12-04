import merge from "lodash/merge";
import debounce from "lodash/debounce";
import { computed, observable, toJS, action } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import {
  combineContainerMixins,
  LineSegment,
  VictoryAxis,
  VictoryContainer,
  VictoryTheme,
  VictoryTooltip,
  voronoiContainerMixin,
  zoomContainerMixin
} from "victory";
import Chart from "./Chart";

@observer
class BottomDockChart extends React.Component {
  @observable _clipDomain;

  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    chartItems: PropTypes.array.isRequired,
    xAxis: PropTypes.object.isRequired
  };

  /**
   * Compute the entire domain for all chartItems.
   */
  @computed get chartDomain() {
    return calculateDomain(this.props.chartItems);
  }

  @action
  componentDidUpdate(prevProps) {
    // Unset _clipDomain if chart domain changed
    const prevDomain = calculateDomain(prevProps.chartItems);
    if (!domainEquals(prevDomain, this.chartDomain))
      this._clipDomain = undefined;
  }

  @computed get clipDomain() {
    return this._clipDomain || this.chartDomain;
  }

  @action
  onDomainChanged(newDomain) {
    this._clipDomain = newDomain;
  }

  @computed
  get theme() {
    const fontSize = 10;
    return merge({}, VictoryTheme.grayscale, {
      chart: { padding: { top: 30, bottom: 30, left: 50, right: 50 } },
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
      zoomContainerMixin
      // cursorContainerMixin -- TODO: breaks eventHandlers used for moment charts
    ];
    const Container = combineContainerMixins(mixins, VictoryContainer);

    const getTooltipValue = ({ datum }) => {
      const tooltipValue = datum.tooltipValue || datum.y || datum._y;
      const units = datum.units || "";
      return `${datum.name}: ${tooltipValue} ${units}`;
    };
    return (
      <Container
        zoomDimension="x"
        cursorDimension="x"
        zoomDomain={toJS(this.chartDomain)} // the initial domain
        cursorComponent={
          <LineSegment style={{ stroke: "white", opacity: "0.5" }} />
        }
        labels={getTooltipValue}
        labelComponent={<VictoryTooltip cornerRadius={0} />}
        onZoomDomainChange={debounce(this.onDomainChanged.bind(this))}
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

  @computed
  get chartItems() {
    return sortChartItemsByType(this.props.chartItems).map(c =>
      clipPointsToVisibleDomain(c, this.clipDomain)
    );
  }

  render() {
    return (
      <Chart
        width={this.props.width}
        height={this.props.height}
        domain={toJS(this.chartDomain)}
        chartItems={this.chartItems}
        xAxis={this.props.xAxis}
        theme={this.theme}
        containerComponent={this.containerComponent}
        renderYAxis={this.renderYAxis.bind(this)}
      />
    );
  }
}

/**
 * Sorts chartItems so that `momentPoints` are rendered on top then
 * `momentLines` and then any other types.
 * @param {ChartItem[]} chartItems array of chartItems to sort
 */
function sortChartItemsByType(chartItems) {
  const order = ["momentLines", "momentPoints"];
  return chartItems.slice().sort((a, b) => {
    return order.indexOf(a.type) - order.indexOf(b.type);
  });
}

/**
 * Removes data outside visible domain.
 */
function clipPointsToVisibleDomain(chartItem, domain) {
  const startIndex = chartItem.points.findIndex(p => p.x >= domain.x[0]);
  const endIndex = chartItem.points.findIndex(p => p.x > domain.x[1]);
  const clippedPoints = chartItem.points.slice(startIndex, endIndex);
  return {
    ...chartItem,
    points: clippedPoints
  };
}

/**
 * Calculates a combined domain of all chartItems.
 */
function calculateDomain(chartItems) {
  const xmin = Math.min(...chartItems.map(c => c.domain.x[0]));
  const xmax = Math.max(...chartItems.map(c => c.domain.x[1]));
  const ymin = Math.min(...chartItems.map(c => c.domain.y[0]));
  const ymax = Math.max(...chartItems.map(c => c.domain.y[1]));
  return {
    x: [xmin, xmax],
    y: [ymin, ymax]
  };
}

/**
 * Returns true if the two domains are equal
 */
function domainEquals({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return x1 === x2 && y1 === y2;
}

export default BottomDockChart;
