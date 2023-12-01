import { observer } from "mobx-react";
import { Ref, forwardRef, useImperativeHandle, useRef } from "react";
import type { ChartItem } from "../../../ModelMixins/ChartableMixin";
import LineChart from "./LineChart";
import MomentPointsChart from "./MomentPointsChart";
import type { ChartZoomHandle, Scales } from "./types";

interface Props {
  id: string;
  chartItem: ChartItem;
  scales: Scales;
  color?: string;
  glyph?: string;
}

/**
 * A line chart, where each data point is represented by a circle, and a line is
 * drawn between each point.
 */
const _LineAndPointChart = function LineAndPointChart(
  props: Props,
  ref: Ref<ChartZoomHandle>
) {
  const lineRef = useRef<ChartZoomHandle>(null);
  const pointRef = useRef<ChartZoomHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      doZoom(scales) {
        lineRef.current?.doZoom(scales);
        pointRef.current?.doZoom(scales);
      }
    }),
    []
  );

  return (
    <>
      <LineChart
        ref={lineRef}
        chartItem={props.chartItem}
        scales={props.scales}
        color={props.color}
        id={props.id + "-line"}
      />
      <MomentPointsChart
        ref={pointRef}
        id={props.id + "-point"}
        chartItem={props.chartItem}
        scales={props.scales}
        glyph={props.glyph}
      />
    </>
  );
};

export default observer(forwardRef(_LineAndPointChart));
