import { observer } from "mobx-react";
import { action, computed, observable, runInAction, trace } from "mobx";
import { AxisLeft, AxisBottom } from "@vx/axis";
import { RectClipPath } from "@vx/clip-path";
import { localPoint } from "@vx/event";
import { GridRows } from "@vx/grid";
import { Group } from "@vx/group";
import { scaleLinear, scaleTime } from "@vx/scale";
import { Line } from "@vx/shape";
import PropTypes from "prop-types";
import React from "react";
import groupBy from "lodash/groupBy";
import minBy from "lodash/minBy";
import Legends from "./Legends";
import LineChart from "./LineChart";
import MomentLinesChart from "./MomentLinesChart";
import MomentPointsChart from "./MomentPointsChart";
import Sized from "./Sized";
import Tooltip from "./Tooltip";
import ZoomX from "./ZoomX";

const chartMinWidth = 110;
const defaultGridColor = "#efefef";

@observer
class BottomDockChart extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    chartItems: PropTypes.array.isRequired,
    xAxis: PropTypes.object.isRequired,
    margin: PropTypes.object
  };

  render() {
    return (
      <Sized>
        {/* We use Sized for sizing the chart svg to parent width */}
        {({ width: parentWidth }) => (
          <Chart
            {...this.props}
            width={Math.max(chartMinWidth, this.props.width || parentWidth)}
          />
        )}
      </Sized>
    );
  }
}

export default BottomDockChart;

@observer
class Chart extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    chartItems: PropTypes.array.isRequired,
    xAxis: PropTypes.object.isRequired,
    margin: PropTypes.object
  };

  static defaultProps = {
    margin: { left: 100, right: 100, top: 10, bottom: 50 }
  };

  @observable zoomedXScale;
  @observable mouseCoords;

  @computed
  get chartItems() {
    return sortChartItemsByType(this.props.chartItems).map(chartItem => {
      const key = `chartItem-${chartItem.cateogryName}-${
        chartItem.name
      }`.replace(/[^a-z0-9-]/gi, "-");
      return {
        ...chartItem,
        key,
        points: chartItem.points.sort((p1, p2) => p1.x - p2.x)
      };
    });
  }

  @computed
  get plot() {
    const { width, height, margin } = this.props;
    return {
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom - Legends.maxHeightPx
    };
  }

  @computed
  get initialXScale() {
    const xAxis = this.props.xAxis;
    const domain = calculateDomain(this.chartItems);
    const params = {
      domain: domain.x,
      range: [0, this.plot.width]
    };
    if (xAxis.scale === "linear") return scaleLinear(params);
    else return scaleTime(params);
  }

  @computed
  get xScale() {
    return this.zoomedXScale || this.initialXScale;
  }

  @computed
  get yAxes() {
    const range = [this.plot.height, 0];
    const chartItemsByUnit = groupBy(this.chartItems, "units");
    return Object.entries(chartItemsByUnit).map(([units, chartItems]) => {
      return {
        units: units === "undefined" ? undefined : units,
        scale: scaleLinear({ domain: calculateDomain(chartItems).y, range }),
        color: chartItems[0].getColor()
      };
    });
  }

  @computed
  get initialScales() {
    return this.chartItems.map(c => ({
      x: this.initialXScale,
      y: this.yAxes.find(y => y.units === c.units).scale
    }));
  }

  @computed
  get zoomedScales() {
    return this.chartItems.map(c => ({
      x: this.xScale,
      y: this.yAxes.find(y => y.units === c.units).scale
    }));
  }

  @computed
  get cursorX() {
    if (this.pointsNearMouse.length > 0)
      return this.xScale(this.pointsNearMouse[0].point.x);
    return this.mouseCoords && this.mouseCoords.x;
  }

  @computed
  get pointsNearMouse() {
    if (!this.mouseCoords) return [];
    return this.chartItems
      .map(chartItem => ({
        chartItem,
        point: findNearestPoint(
          chartItem.points,
          this.mouseCoords,
          this.xScale,
          7
        )
      }))
      .filter(({ point }) => point !== undefined);
  }

  @computed
  get tooltip() {
    const margin = this.props.margin;
    const tooltip = {
      items: this.pointsNearMouse
    };

    if (!this.mouseCoords || this.mouseCoords.x < this.plot.width * 0.75) {
      tooltip.right = this.props.width - (this.plot.width + margin.right);
    } else {
      tooltip.left = margin.left;
    }

    if (!this.mouseCoords || this.mouseCoords.y < this.plot.height * 0.5) {
      tooltip.bottom = this.props.height - (margin.top + this.plot.height);
    } else {
      tooltip.top = margin.top;
    }
    return tooltip;
  }

  @action
  setZoomedXScale(scale) {
    this.zoomedXScale = scale;
  }

  @action
  setMouseCoords(coords) {
    this.mouseCoords = coords;
  }

  setMouseCoordsFromEvent(event) {
    const coords = localPoint(
      event.target.ownerSVGElement || event.target,
      event
    );
    if (!coords) return;
    this.setMouseCoords({
      x: coords.x - this.props.margin.left,
      y: coords.y - this.props.margin.top
    });
  }

  render() {
    const { width, height, margin } = this.props;
    return (
      <ZoomX
        surface="#zoomSurface"
        initialScale={this.initialXScale}
        scaleExtent={[1, Infinity]}
        translateExtent={[[0, 0], [Infinity, Infinity]]}
        onZoom={zoomedScale => this.setZoomedXScale(zoomedScale)}
      >
        <Legends chartItems={this.chartItems} />
        <div style={{ position: "relative" }}>
          <svg
            width={width}
            height={height}
            onMouseMove={this.setMouseCoordsFromEvent.bind(this)}
            onMouseLeave={() => this.setMouseCoords(undefined)}
          >
            <Group left={margin.left} top={margin.top}>
              <RectClipPath
                id="plotClip"
                width={this.plot.width}
                height={this.plot.height}
              />
              <XAxis top={this.plot.height + 1} scale={this.xScale} />
              <For each="y" index="i" of={this.yAxes}>
                <YAxis
                  {...y}
                  key={`y-axis-${y.units}`}
                  color={this.yAxes.length > 1 ? y.color : defaultGridColor}
                  offset={i * 50}
                />
              </For>
              <For each="y" index="i" of={this.yAxes}>
                <GridRows
                  key={`grid-${y.units}`}
                  width={this.plot.width}
                  height={this.plot.height}
                  scale={y.scale}
                  numTicks={4}
                  stroke={this.yAxes.length > 1 ? y.color : defaultGridColor}
                  lineStyle={{ opacity: 0.3 }}
                />
              </For>
              <svg
                id="zoomSurface"
                clipPath="url(#plotClip)"
                pointerEvents="all"
              >
                <rect
                  width={this.plot.width}
                  height={this.plot.height}
                  fill="transparent"
                />
                {this.cursorX && (
                  <Cursor x={this.cursorX} stroke={defaultGridColor} />
                )}
                <Plot
                  chartItems={this.chartItems}
                  initialScales={this.initialScales}
                  zoomedScales={this.zoomedScales}
                />
              </svg>
            </Group>
          </svg>
          <Tooltip {...this.tooltip} />
        </div>
      </ZoomX>
    );
  }
}

@observer
class Plot extends React.Component {
  static propTypes = {
    chartItems: PropTypes.array.isRequired,
    initialScales: PropTypes.array.isRequired,
    zoomedScales: PropTypes.array.isRequired
  };

  componentDidUpdate() {
    Object.values(this.refs).forEach((ref, i) => {
      if (typeof ref.doZoom === "function")
        ref.doZoom(this.props.zoomedScales[i]);
    });
  }

  render() {
    const { chartItems, initialScales } = this.props;
    return chartItems.map((chartItem, i) => {
      switch (chartItem.type) {
        case "line":
          return (
            <LineChart
              key={chartItem.key}
              ref={chartItem.key}
              id={chartItem.key}
              chartItem={chartItem}
              scales={initialScales[i]}
            />
          );
        case "momentPoints": {
          const basisItem = chartItems.find(
            item => item.type === "line" && item.xAxis.scale === "time"
          );
          return (
            <MomentPointsChart
              key={chartItem.key}
              ref={chartItem.key}
              id={chartItem.key}
              chartItem={chartItem}
              basisItem={basisItem}
              scales={initialScales[i]}
            />
          );
        }
        case "momentLines": {
          return (
            <MomentLinesChart
              key={chartItem.key}
              ref={chartItem.key}
              id={chartItem.key}
              chartItem={chartItem}
              scales={initialScales[i]}
            />
          );
        }
      }
    });
  }
}

class XAxis extends React.PureComponent {
  render() {
    return (
      <AxisBottom
        stroke="#efefef"
        tickStroke="#efefef"
        tickLabelProps={() => ({
          fill: "#efefef",
          textAnchor: "middle",
          fontSize: 12,
          fontFamily: "Arial"
        })}
        {...this.props}
      />
    );
  }
}

class YAxis extends React.PureComponent {
  static propTypes = {
    scale: PropTypes.func.isRequired,
    color: PropTypes.string.isRequired,
    units: PropTypes.string,
    offset: PropTypes.number.isRequired
  };

  render() {
    const { scale, color, units, offset } = this.props;
    return (
      <AxisLeft
        key={`y-axis-${units}`}
        left={offset}
        scale={scale}
        numTicks={4}
        stroke={color}
        tickStroke={color}
        label={units || ""}
        labelOffset={24}
        labelProps={{
          fill: color,
          textAnchor: "middle",
          fontSize: 12,
          fontFamily: "Arial"
        }}
        tickLabelProps={() => ({
          fill: color,
          textAnchor: "end",
          fontSize: 10,
          fontFamily: "Arial",
          dx: "-0.25em",
          dy: "0.25em"
        })}
      />
    );
  }
}

class Cursor extends React.PureComponent {
  static propTypes = {
    x: PropTypes.number.isRequired
  };

  render() {
    const { x, ...rest } = this.props;
    return <Line from={{ x, y: 0 }} to={{ x, y: 1000 }} {...rest} />;
  }
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
 * Sorts chartItems so that `momentPoints` are rendered on top then
 * `momentLines` and then any other types.
 * @param {ChartItem[]} chartItems array of chartItems to sort
 */
function sortChartItemsByType(chartItems) {
  return chartItems.slice().sort((a, b) => {
    if (a.type === "momentPoints") return 1;
    else if (b.type === "momentPoints") return -1;
    else if (a.type === "momentLines") return 1;
    else if (b.type === "momentLines") return -1;
    return 0;
  });
}

function findNearestPoint(points, coords, xScale, maxDistancePx) {
  function distance(coords, point) {
    return point ? coords.x - xScale(point.x) : Infinity;
  }

  let left = 0;
  let right = points.length;
  let mid = 0;
  while (true) {
    if (left === right) break;
    mid = left + Math.floor((right - left) / 2);
    if (distance(coords, points[mid]) === 0) break;
    else if (distance(coords, points[mid]) < 0) right = mid;
    else left = mid + 1;
  }

  const leftPoint = points[mid - 1];
  const midPoint = points[mid];
  const rightPoint = points[mid + 1];

  const nearestPoint = minBy([leftPoint, midPoint, rightPoint], p =>
    p ? Math.abs(distance(coords, p)) : Infinity
  );

  return Math.abs(distance(coords, nearestPoint)) <= maxDistancePx
    ? nearestPoint
    : undefined;
}
