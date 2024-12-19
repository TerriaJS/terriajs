import { observer } from "mobx-react";
import { action, computed, observable, makeObservable } from "mobx";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { RectClipPath } from "@visx/clip-path";
import { localPoint } from "@visx/event";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { withParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { Line } from "@visx/shape";
import PropTypes from "prop-types";
import React from "react";
import groupBy from "lodash-es/groupBy";
import minBy from "lodash-es/minBy";
import Legends from "./Legends";
import LineChart from "./LineChart";
import MomentLinesChart from "./MomentLinesChart";
import MomentPointsChart from "./MomentPointsChart";
import Tooltip from "./Tooltip";
import ZoomX from "./ZoomX";
import Styles from "./bottom-dock-chart.scss";
import LineAndPointChart from "./LineAndPointChart";
import PointOnMap from "./PointOnMap";

const chartMinWidth = 110;
const defaultGridColor = "#efefef";
const labelColor = "#efefef";

@observer
class BottomDockChart extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    parentWidth: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    chartItems: PropTypes.array.isRequired,
    xAxis: PropTypes.object.isRequired,
    margin: PropTypes.object
  };

  static defaultProps = {
    parentWidth: 0
  };

  render() {
    return (
      // @ts-expect-error TS(2739): Type '{ width: number; children?: ReactNode; }' is... Remove this comment to see the full error message
      <Chart
        {...this.props}
        width={Math.max(
          chartMinWidth,
          // @ts-expect-error TS(2339): Property 'width' does not exist on type 'Readonly<... Remove this comment to see the full error message
          this.props.width || this.props.parentWidth
        )}
      />
    );
  }
}

export default withParentSize(BottomDockChart);

@observer
class Chart extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    chartItems: PropTypes.array.isRequired,
    xAxis: PropTypes.object.isRequired,
    margin: PropTypes.object
  };

  static defaultProps = {
    margin: { left: 20, right: 30, top: 10, bottom: 50 }
  };

  @observable.ref zoomedXScale: any;
  @observable mouseCoords: any;

  constructor(props: any) {
    super(props);
    makeObservable(this);
  }

  @computed
  get chartItems() {
    // @ts-expect-error TS(2339): Property 'chartItems' does not exist on type 'Read... Remove this comment to see the full error message
    return sortChartItemsByType(this.props.chartItems)
      .map((chartItem: any) => {
        return {
          ...chartItem,
          points: chartItem.points.sort((p1: any, p2: any) => p1.x - p2.x)
        };
      })
      .filter((chartItem: any) => chartItem.points.length > 0);
  }

  @computed
  get plotHeight() {
    // @ts-expect-error TS(2339): Property 'height' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { height, margin } = this.props;
    return height - margin.top - margin.bottom - Legends.maxHeightPx;
  }

  @computed
  get plotWidth() {
    // @ts-expect-error TS(2339): Property 'width' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const { width, margin } = this.props;
    return width - margin.left - margin.right - this.estimatedYAxesWidth;
  }

  @computed
  get adjustedMargin() {
    // @ts-expect-error TS(2339): Property 'margin' does not exist on type 'Readonly... Remove this comment to see the full error message
    const margin = this.props.margin;
    return {
      ...margin,
      left: margin.left + this.estimatedYAxesWidth
    };
  }

  @computed
  get initialXScale() {
    // @ts-expect-error TS(2339): Property 'xAxis' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const xAxis = this.props.xAxis;
    const domain = calculateDomain(this.chartItems);
    const params = {
      domain: domain.x,
      range: [0, this.plotWidth]
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
    const range = [this.plotHeight, 0];
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
    return this.chartItems.map((c: any) => ({
      x: this.initialXScale,
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      y: this.yAxes.find((y) => y.units === c.units).scale
    }));
  }

  @computed
  get zoomedScales() {
    return this.chartItems.map((c: any) => ({
      x: this.xScale,
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      y: this.yAxes.find((y) => y.units === c.units).scale
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
      .map((chartItem: any) => ({
        chartItem,

        point: findNearestPoint(
          chartItem.points,
          this.mouseCoords,
          this.xScale,
          7
        )
      }))
      .filter(({ point }: any) => point !== undefined);
  }

  @computed
  get tooltip() {
    const margin = this.adjustedMargin;
    const tooltip = {
      items: this.pointsNearMouse
    };

    if (!this.mouseCoords || this.mouseCoords.x < this.plotWidth * 0.5) {
      // @ts-expect-error TS(2339): Property 'right' does not exist on type '{ items: ... Remove this comment to see the full error message
      tooltip.right = this.props.width - (this.plotWidth + margin.right);
    } else {
      // @ts-expect-error TS(2339): Property 'left' does not exist on type '{ items: a... Remove this comment to see the full error message
      tooltip.left = margin.left;
    }

    // @ts-expect-error TS(2339): Property 'bottom' does not exist on type '{ items:... Remove this comment to see the full error message
    tooltip.bottom = this.props.height - (margin.top + this.plotHeight);
    return tooltip;
  }

  @computed
  get estimatedYAxesWidth() {
    const numTicks = 4;
    const tickLabelFontSize = 10;
    // We need to consider only the left most Y-axis as its label values appear
    // outside the chart plot area. The labels of inner y-axes appear inside
    // the plot area.
    const leftmostYAxis = this.yAxes[0];
    const maxLabelDigits = Math.max(
      0,
      ...leftmostYAxis.scale.ticks(numTicks).map((n) => n.toString().length)
    );
    return maxLabelDigits * tickLabelFontSize;
  }

  @action
  setZoomedXScale(scale: any) {
    this.zoomedXScale = scale;
  }

  @action
  setMouseCoords(coords: any) {
    this.mouseCoords = coords;
  }

  setMouseCoordsFromEvent(event: any) {
    const coords = localPoint(
      event.target.ownerSVGElement || event.target,
      event
    );
    if (!coords) return;
    this.setMouseCoords({
      x: coords.x - this.adjustedMargin.left,
      y: coords.y - this.adjustedMargin.top
    });
  }

  componentDidUpdate(prevProps: any) {
    // Unset zoom scale if any chartItems are added or removed
    // @ts-expect-error TS(2339): Property 'chartItems' does not exist on type 'Read... Remove this comment to see the full error message
    if (prevProps.chartItems.length !== this.props.chartItems.length) {
      this.setZoomedXScale(undefined);
    }
  }

  render() {
    // @ts-expect-error TS(2339): Property 'height' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { height, xAxis, terria } = this.props;
    if (this.chartItems.length === 0)
      return <div className={Styles.empty}>No data available</div>;

    return (
      <ZoomX
        surface="#zoomSurface"
        initialScale={this.initialXScale}
        scaleExtent={[1, Infinity]}
        translateExtent={[
          [0, 0],
          [Infinity, Infinity]
        ]}
        onZoom={(zoomedScale) => this.setZoomedXScale(zoomedScale)}
      >
        <Legends width={this.plotWidth} chartItems={this.chartItems} />
        <div style={{ position: "relative" }}>
          <svg
            width="100%"
            height={height}
            onMouseMove={this.setMouseCoordsFromEvent.bind(this)}
            onMouseLeave={() => this.setMouseCoords(undefined)}
          >
            <Group
              left={this.adjustedMargin.left}
              top={this.adjustedMargin.top}
            >
              <RectClipPath
                id="plotClip"
                width={this.plotWidth}
                height={this.plotHeight}
              />
              <XAxis
                top={this.plotHeight + 1}
                scale={this.xScale}
                label={xAxis.units || (xAxis.scale === "time" && "Date")}
              />
              {this.yAxes.map((y, i) => (
                <YAxis
                  {...y}
                  key={`y-axis-${y.units}`}
                  color={this.yAxes.length > 1 ? y.color : defaultGridColor}
                  offset={i * 50}
                />
              ))}
              {this.yAxes.map((y, _i) => (
                <GridRows
                  key={`grid-${y.units}`}
                  width={this.plotWidth}
                  height={this.plotHeight}
                  scale={y.scale}
                  numTicks={4}
                  stroke={this.yAxes.length > 1 ? y.color : defaultGridColor}
                  lineStyle={{ opacity: 0.3 }}
                />
              ))}
              <svg
                id="zoomSurface"
                clipPath="url(#plotClip)"
                pointerEvents="all"
              >
                <rect
                  width={this.plotWidth}
                  height={this.plotHeight}
                  fill="transparent"
                />
                {this.cursorX && (
                  // @ts-expect-error TS(2769): No overload matches this call.
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
          <PointsOnMap terria={terria} chartItems={this.chartItems} />
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

  constructor(props: any) {
    super(props);
    makeObservable(this);
  }

  @computed
  get chartRefs() {
    // @ts-expect-error TS(2339): Property 'chartItems' does not exist on type 'Read... Remove this comment to see the full error message
    return this.props.chartItems.map((_: any) => React.createRef());
  }

  componentDidUpdate() {
    // @ts-expect-error TS(2769): No overload matches this call.
    Object.values(this.chartRefs).forEach(({ current: ref }, i) => {
      if (typeof ref.doZoom === "function") {
        // @ts-expect-error TS(2339): Property 'zoomedScales' does not exist on type 'Re... Remove this comment to see the full error message
        ref.doZoom(this.props.zoomedScales[i]);
      }
    });
  }

  render() {
    // @ts-expect-error TS(2339): Property 'chartItems' does not exist on type 'Read... Remove this comment to see the full error message
    const { chartItems, initialScales } = this.props;
    return chartItems.map((chartItem: any, i: any) => {
      switch (chartItem.type) {
        case "line":
          return (
            <LineChart
              key={chartItem.key}
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
              chartItem={chartItem}
              scales={initialScales[i]}
            />
          );
        case "momentPoints": {
          // Find a basis item to stick the points on, if we can't find one, we
          // vertically center the points
          const basisItemIndex = chartItems.findIndex(
            (item: any) =>
              (item.type === "line" || item.type === "lineAndPoint") &&
              item.xAxis.scale === "time"
          );
          return (
            <MomentPointsChart
              key={chartItem.key}
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
              chartItem={chartItem}
              scales={initialScales[i]}
              basisItem={chartItems[basisItemIndex]}
              basisItemScales={initialScales[basisItemIndex]}
              glyph={chartItem.glyphStyle}
            />
          );
        }
        case "momentLines": {
          return (
            <MomentLinesChart
              key={chartItem.key}
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
              chartItem={chartItem}
              scales={initialScales[i]}
            />
          );
        }
        case "lineAndPoint": {
          return (
            <LineAndPointChart
              key={chartItem.key}
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
              chartItem={chartItem}
              scales={initialScales[i]}
              glyph={chartItem.glyphStyle}
            />
          );
        }
      }
    });
  }
}

class XAxis extends React.PureComponent {
  static propTypes = {
    top: PropTypes.number.isRequired,
    scale: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired
  };

  render() {
    // @ts-expect-error TS(2339): Property 'scale' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const { scale, ...restProps } = this.props;
    return (
      // @ts-expect-error TS(2322): Type '{ children?: ReactNode; stroke: string; tick... Remove this comment to see the full error message
      <AxisBottom
        stroke="#efefef"
        tickStroke="#efefef"
        tickLabelProps={() => ({
          fill: "#efefef",
          textAnchor: "middle",
          fontSize: 12,
          fontFamily: "Arial"
        })}
        labelProps={{
          fill: labelColor,
          fontSize: 12,
          textAnchor: "middle",
          fontFamily: "Arial"
        }}
        // .nice() rounds the scale so that the aprox beginning and
        // aprox end labels are shown
        // See: https://stackoverflow.com/questions/21753126/d3-js-starting-and-ending-tick
        scale={scale.nice()}
        {...restProps}
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
    // @ts-expect-error TS(2339): Property 'scale' does not exist on type 'Readonly<... Remove this comment to see the full error message
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
        labelOffset={10}
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
          fontFamily: "Arial"
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
    // @ts-expect-error TS(2339): Property 'x' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { x, ...rest } = this.props;
    return <Line from={{ x, y: 0 }} to={{ x, y: 1000 }} {...rest} />;
  }
}

function PointsOnMap({ chartItems, terria }: any) {
  return chartItems.map(
    (chartItem: any) =>
      chartItem.pointOnMap && (
        <PointOnMap
          key={`point-on-map-${chartItem.key}`}
          terria={terria}
          color={chartItem.getColor()}
          point={chartItem.pointOnMap}
        />
      )
  );
}

/**
 * Calculates a combined domain of all chartItems.
 */
function calculateDomain(chartItems: any) {
  const xmin = Math.min(...chartItems.map((c: any) => c.domain.x[0]));
  const xmax = Math.max(...chartItems.map((c: any) => c.domain.x[1]));
  const ymin = Math.min(...chartItems.map((c: any) => c.domain.y[0]));
  const ymax = Math.max(...chartItems.map((c: any) => c.domain.y[1]));
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
function sortChartItemsByType(chartItems: any) {
  return chartItems.slice().sort((a: any, b: any) => {
    if (a.type === "momentPoints") return 1;
    else if (b.type === "momentPoints") return -1;
    else if (a.type === "momentLines") return 1;
    else if (b.type === "momentLines") return -1;
    return 0;
  });
}

function findNearestPoint(
  points: any,
  coords: any,
  xScale: any,
  maxDistancePx: any
) {
  function distance(coords: any, point: any) {
    return point ? coords.x - xScale(point.x) : Infinity;
  }

  let left = 0;
  let right = points.length;
  let mid = 0;
  for (;;) {
    if (left === right) break;
    mid = left + Math.floor((right - left) / 2);
    if (distance(coords, points[mid]) === 0) break;
    else if (distance(coords, points[mid]) < 0) right = mid;
    else left = mid + 1;
  }

  const leftPoint = points[mid - 1];
  const midPoint = points[mid];
  const rightPoint = points[mid + 1];

  const nearestPoint = minBy([leftPoint, midPoint, rightPoint], (p) =>
    p ? Math.abs(distance(coords, p)) : Infinity
  );

  return Math.abs(distance(coords, nearestPoint)) <= maxDistancePx
    ? nearestPoint
    : undefined;
}

function sanitizeIdString(id: any) {
  // delete all non-alphanum chars
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}
