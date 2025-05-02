import { select as d3Select } from "d3-selection";
import { zoom as d3Zoom } from "d3-zoom";
import { useEffect, type ReactNode } from "react";
import { XScale } from "./types";

interface Props {
  initialScale: XScale;
  scaleExtent: [number, number];
  translateExtent: [[number, number], [number, number]];
  children: ReactNode;
  onZoom: (arg: XScale) => void;
  surface: string;
}

export const ZoomX = ({
  surface,
  scaleExtent,
  translateExtent,
  initialScale,
  onZoom,
  children
}: Props) => {
  useEffect(() => {
    const zoom = d3Zoom()
      .scaleExtent(scaleExtent)
      .translateExtent(translateExtent)
      .on("zoom", (event) => {
        onZoom(event.transform.rescaleX(initialScale));
      });

    d3Select(surface).call(zoom as never);
  }, [initialScale, onZoom, scaleExtent, surface, translateExtent]);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};
ZoomX.displayName = "ZoomX";

export default ZoomX;
