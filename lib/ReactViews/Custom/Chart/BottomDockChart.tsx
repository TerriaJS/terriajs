import { AxisBottom, AxisLeft } from "@visx/axis";
import { RectClipPath } from "@visx/clip-path";
import { localPoint } from "@visx/event";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { withParentSize } from "@visx/responsive";
import { WithParentSizeProvidedProps } from "@visx/responsive/lib/enhancers/withParentSize";
import { scaleLinear, scaleTime } from "@visx/scale";
import { Line } from "@visx/shape";
import groupBy from "lodash-es/groupBy";
import minBy from "lodash-es/minBy";
import { observer } from "mobx-react";
import {
  ComponentPropsWithoutRef,
  ComponentType,
  createRef,
  memo,
  useEffect,
  useMemo,
  useState
} from "react";
import { ChartPoint } from "../../../Charts/ChartData";
import { ChartAxis, ChartItem } from "../../../ModelMixins/ChartableMixin";
import Legends from "./Legends";
import LineAndPointChart from "./LineAndPointChart";
import LineChart from "./LineChart";
import MomentLinesChart from "./MomentLinesChart";
import MomentPointsChart from "./MomentPointsChart";
import PointOnMap from "./PointOnMap";
import Tooltip from "./Tooltip";
import ZoomX from "./ZoomX";
import Styles from "./bottom-dock-chart.scss";
import { ChartZoomHandle, XScale, YScale } from "./types";

const chartMinWidth = 110;
const defaultGridColor = "#efefef";
const labelColor = "#efefef";
const yAxisNumTicks = 4;
const yAxisTickLabelFontSize = 10;

interface BottomDockChartProps extends WithParentSizeProvidedProps {
  width?: number;
  height: number;
  chartItems: readonly ChartItem[];
  xAxis: ChartAxis;
  margin?: { left: number; right: number; top: number; bottom: number };
}

function BottomDockChart(props: BottomDockChartProps) {
  return (
    <Chart
      {...props}
      width={Math.max(chartMinWidth, props.width ?? props.parentWidth ?? 0)}
    />
  );
}

// withParentSize doesn't have great ts types
export default withParentSize(
  observer(BottomDockChart) as any
) as unknown as ComponentType<BottomDockChartProps>;

interface ChartProps {
  width: number;
  height: number;
  chartItems: readonly ChartItem[];
  xAxis: ChartAxis;
  margin?: { left: number; right: number; top: number; bottom: number };
}

const Chart = observer(function Chart(props: ChartProps) {
  const {
    height,
    width,
    xAxis,
    margin = { left: 20, right: 30, top: 10, bottom: 50 }
  } = props;

  const [zoomedXScale, setZoomedXScale] = useState<any>(undefined);
  const [mouseCoords, setMouseCoords] = useState<
    { x: number; y: number } | undefined
  >(undefined);

  const processedChartItems: ChartItem[] = useMemo(() => {
    return sortChartItemsByType(props.chartItems)
      .filter((chartItem) => chartItem.points.length > 0)
      .map((chartItem) => {
        return {
          ...chartItem,
          points: chartItem.points.slice().sort((p1, p2) => +p1.x - +p2.x)
        };
      });
  }, [props.chartItems]);

  const plotHeight = height - margin.top - margin.bottom - Legends.maxHeightPx;

  const yAxes = useMemo(() => {
    const range = [plotHeight, 0];
    const chartItemsByUnit = groupBy(processedChartItems, "units");
    return Object.entries(chartItemsByUnit).map(([units, chartItems]) => {
      return {
        units: units === "undefined" ? undefined : units,
        scale: scaleLinear({ domain: calculateDomainY(chartItems), range }),
        color: chartItems[0].getColor()
      };
    });
  }, [plotHeight, processedChartItems]);

  // We need to consider only the left most Y-axis as its label values appear
  // outside the chart plot area. The labels of inner y-axes appear inside
  // the plot area.
  const leftmostYAxis = yAxes[0];
  const maxLabelDigits = Math.max(
    0,
    ...leftmostYAxis.scale.ticks(yAxisNumTicks).map((n) => n.toString().length)
  );
  const estimatedYAxesWidth = maxLabelDigits * yAxisTickLabelFontSize;

  const plotWidth = width - margin.left - margin.right - estimatedYAxesWidth;

  const adjustedMargin = {
    ...margin,
    left: margin.left + estimatedYAxesWidth
  };

  const initialXScale = useMemo(() => {
    const params = {
      domain: calculateDomainX(processedChartItems),
      range: [0, plotWidth]
    };
    if (xAxis.scale === "linear") return scaleLinear(params);
    else return scaleTime(params);
  }, [xAxis, processedChartItems, plotWidth]);

  const xScale = zoomedXScale || initialXScale;

  const initialScales = processedChartItems.map((c) => ({
    x: initialXScale,
    y: yAxes.find((y) => y.units === c.units)!.scale
  }));

  const zoomedScales = processedChartItems.map((c) => ({
    x: xScale,
    y: yAxes.find((y) => y.units === c.units)!.scale
  }));

  // Type guard to filter ChartItems that don't produce a nearestPoint
  const pointNotUndefined = (itemPoint: {
    chartItem: ChartItem;
    point?: ChartPoint;
  }): itemPoint is { chartItem: ChartItem; point: ChartPoint } =>
    itemPoint.point !== undefined;

  const pointsNearMouse = useMemo(() => {
    if (!mouseCoords) return [];
    return processedChartItems
      .map((chartItem: ChartItem) => ({
        chartItem,
        point: findNearestPoint(chartItem.points, mouseCoords, xScale, 7)
      }))
      .filter(pointNotUndefined);
  }, [processedChartItems, mouseCoords, xScale]);

  const cursorX =
    pointsNearMouse.length > 0
      ? xScale(pointsNearMouse[0].point.x)
      : mouseCoords?.x;

  const tooltip = useMemo(() => {
    const margin = adjustedMargin;
    const tooltip: {
      items: { chartItem: ChartItem; point: ChartPoint }[];
      right?: number;
      left?: number;
      bottom?: number;
    } = {
      items: pointsNearMouse
    };

    if (!mouseCoords || mouseCoords.x < plotWidth * 0.5) {
      tooltip.right = props.width - (plotWidth + margin.right);
    } else {
      tooltip.left = margin.left;
    }

    tooltip.bottom = props.height - (margin.top + plotHeight);
    return tooltip;
  }, [
    adjustedMargin,
    pointsNearMouse,
    mouseCoords,
    width,
    plotWidth,
    height,
    plotHeight,
    margin
  ]);

  function setMouseCoordsFromEvent(event: any) {
    const coords = localPoint(
      event.target.ownerSVGElement || event.target,
      event
    );
    if (!coords) return;
    setMouseCoords({
      x: coords.x - adjustedMargin.left,
      y: coords.y - adjustedMargin.top
    });
  }

  useEffect(() => {
    setZoomedXScale(undefined);
  }, [processedChartItems]);

  if (processedChartItems.length === 0)
    return <div className={Styles.empty}>No data available</div>;

  return (
    <ZoomX
      surface="#zoomSurface"
      initialScale={initialXScale}
      scaleExtent={[1, Infinity]}
      translateExtent={[
        [0, 0],
        [Infinity, Infinity]
      ]}
      onZoom={setZoomedXScale}
    >
      <Legends width={plotWidth} chartItems={processedChartItems} />
      <div style={{ position: "relative" }}>
        <svg
          width="100%"
          height={height}
          onMouseMove={setMouseCoordsFromEvent}
          onMouseLeave={() => setMouseCoords(undefined)}
        >
          <Group left={adjustedMargin.left} top={adjustedMargin.top}>
            <RectClipPath id="plotClip" width={plotWidth} height={plotHeight} />
            <XAxis
              top={plotHeight + 1}
              scale={xScale}
              label={
                xAxis.units || (xAxis.scale === "time" ? "Date" : ("" as never))
              }
            />
            {yAxes.map((y, i) => (
              <YAxis
                {...y}
                key={`y-axis-${y.units}`}
                color={yAxes.length > 1 ? y.color : defaultGridColor}
                offset={i * 50}
              />
            ))}
            {yAxes.map((y, i) => (
              <GridRows
                key={`grid-${y.units}`}
                width={plotWidth}
                height={plotHeight}
                scale={y.scale}
                numTicks={yAxisNumTicks}
                stroke={yAxes.length > 1 ? y.color : defaultGridColor}
                lineStyle={{ opacity: 0.3 }}
              />
            ))}
            <svg id="zoomSurface" clipPath="url(#plotClip)" pointerEvents="all">
              <rect width={plotWidth} height={plotHeight} fill="transparent" />
              {cursorX && <Cursor x={cursorX} stroke={defaultGridColor} />}
              <Plot
                chartItems={processedChartItems}
                initialScales={initialScales}
                zoomedScales={zoomedScales}
              />
            </svg>
          </Group>
        </svg>
        <Tooltip {...tooltip} />
        <PointsOnMap chartItems={processedChartItems} />
      </div>
    </ZoomX>
  );
});

interface PlotProps {
  chartItems: readonly ChartItem[];
  initialScales: readonly { x: XScale; y: YScale }[];
  zoomedScales: readonly { x: XScale; y: YScale }[];
}

const Plot = memo(function Plot(props: PlotProps) {
  const { chartItems, initialScales, zoomedScales } = props;
  const chartRefs = useMemo(
    () => chartItems.map(() => createRef<ChartZoomHandle>()),
    [chartItems]
  );

  useEffect(() => {
    chartRefs.forEach(({ current: ref }, i) => {
      if (typeof ref?.doZoom === "function") {
        ref.doZoom(zoomedScales[i]);
      }
    });
  }, [chartRefs, zoomedScales]);

  return chartItems.map((chartItem, i) => {
    switch (chartItem.type) {
      case "line":
        return (
          <LineChart
            key={chartItem.key}
            ref={chartRefs[i]}
            id={sanitizeIdString(chartItem.key)}
            chartItem={chartItem}
            scales={initialScales[i]}
          />
        );
      case "momentPoints": {
        // Find a basis item to stick the points on, if we can't find one, we
        // vertically center the points
        const basisItemIndex = chartItems.findIndex(
          (item) =>
            (item.type === "line" || item.type === "lineAndPoint") &&
            item.xAxis.scale === "time"
        );
        return (
          <MomentPointsChart
            key={chartItem.key}
            ref={chartRefs[i]}
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
            ref={chartRefs[i]}
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
            ref={chartRefs[i]}
            id={sanitizeIdString(chartItem.key)}
            chartItem={chartItem}
            scales={initialScales[i]}
            glyph={chartItem.glyphStyle}
          />
        );
      }
    }
  });
});

interface XAxisProps {
  top: number;
  scale: XScale;
  label: string;
}

const XAxis = memo(function XAxis(props: XAxisProps) {
  const { scale, ...restProps } = props;
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
});

interface YAxisProps {
  scale: YScale;
  color: string;
  units?: string;
  offset: number;
}

const YAxis = memo(function YAxis(props: YAxisProps) {
  const { scale, color, units, offset } = props;
  return (
    <AxisLeft
      key={`y-axis-${units}`}
      left={offset}
      scale={scale}
      numTicks={yAxisNumTicks}
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
        fontSize: yAxisTickLabelFontSize,
        fontFamily: "Arial"
      })}
    />
  );
});

interface CursorProps extends ComponentPropsWithoutRef<typeof Line> {
  x: number;
}

const Cursor = memo(function Cursor(props: CursorProps) {
  const { x, ...rest } = props;
  return <Line from={{ x, y: 0 }} to={{ x, y: 1000 }} {...rest} />;
});

interface PointsOnMapProps {
  chartItems: readonly ChartItem[];
}

const PointsOnMap = observer(function PointsOnMap({
  chartItems
}: PointsOnMapProps) {
  return chartItems.map(
    (chartItem) =>
      chartItem.pointOnMap && (
        <PointOnMap
          key={`point-on-map-${chartItem.key}`}
          color={chartItem.getColor()}
          point={chartItem.pointOnMap}
        />
      )
  );
});

/**
 * Calculates a combined domain of all chartItems.
 * Convert Dates to numbers
 */
function calculateDomainX(chartItems: ChartItem[]) {
  const xmin = Math.min(...chartItems.map((c) => +c.domain.x[0]));
  const xmax = Math.max(...chartItems.map((c) => +c.domain.x[1]));
  return [xmin, xmax];
}

function calculateDomainY(chartItems: ChartItem[]) {
  const ymin = Math.min(...chartItems.map((c) => c.domain.y[0]));
  const ymax = Math.max(...chartItems.map((c) => c.domain.y[1]));
  return [ymin, ymax];
}

/**
 * Sorts chartItems so that `momentPoints` are rendered on top then
 * `momentLines` and then any other types.
 * @param {ChartItem[]} chartItems array of chartItems to sort
 */
function sortChartItemsByType(chartItems: readonly ChartItem[]) {
  return chartItems.slice().sort((a, b) => {
    if (a.type === "momentPoints") return 1;
    else if (b.type === "momentPoints") return -1;
    else if (a.type === "momentLines") return 1;
    else if (b.type === "momentLines") return -1;
    return 0;
  });
}

function findNearestPoint(
  points: readonly ChartPoint[],
  coords: ChartPoint,
  xScale: XScale,
  maxDistancePx: number
) {
  function distance(coords: ChartPoint, point: ChartPoint) {
    // Works with numbers or Dates
    return point ? +coords.x - +xScale(point.x) : Infinity;
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

  return nearestPoint !== undefined &&
    Math.abs(distance(coords, nearestPoint)) <= maxDistancePx
    ? nearestPoint
    : undefined;
}

function sanitizeIdString(id: string) {
  // delete all non-alphanum chars
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}
