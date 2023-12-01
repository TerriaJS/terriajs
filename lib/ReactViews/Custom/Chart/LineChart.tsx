import { LinePath } from "@visx/shape";
import { line } from "d3-shape";
import { observer } from "mobx-react";
import { Ref, forwardRef, useImperativeHandle } from "react";
import type { ChartPoint } from "../../../Charts/ChartData";
import type { ChartItem } from "../../../ModelMixins/ChartableMixin";
import type { ChartZoomHandle, Scales } from "./types";

interface Props {
  id: string;
  chartItem: ChartItem;
  scales: Scales;
  color?: string;
}

const _LineChart = function LineChart(props: Props, ref: Ref<ChartZoomHandle>) {
  const { id, chartItem, scales, color } = props;

  useImperativeHandle(
    ref,
    () => ({
      doZoom(scales) {
        const el = document.querySelector(`#${id} path`);
        if (!el) return;
        const path = (line() as any)
          .x((p: ChartPoint) => scales.x(p.x))
          .y((p: ChartPoint) => scales.y(p.y));
        el.setAttribute("d", path(chartItem.points));
      }
    }),
    [id, chartItem]
  );

  const stroke = color || chartItem.getColor();
  return (
    <g id={id}>
      <LinePath
        data={chartItem.points as ChartPoint[]}
        x={(p) => scales.x(p.x)}
        y={(p) => scales.y(p.y)}
        stroke={stroke}
        strokeWidth={2}
      />
    </g>
  );
};

export default observer(forwardRef(_LineChart));
