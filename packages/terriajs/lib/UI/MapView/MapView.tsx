import { clsx } from "clsx";
import { useEffect, useRef, type ReactElement } from "react";
import type TerriaViewer from "../../ViewModels/TerriaViewer";
import "./MapView.css";

/** What the map view needs of a TerriaViewer */
type MapViewer = Pick<TerriaViewer, "attach" | "detach">;

type MapViewProps = {
  viewer: MapViewer;
  className?: string;
};

/** The element the 2D map or 3D globe is drawn into, filling its parent */
const MapView = ({ viewer, className }: MapViewProps): ReactElement => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) viewer.attach(ref.current);
    return () => {
      viewer.detach();
    };
  }, [viewer]);

  // Leaflet and Cesium build their own DOM and style it with their own CSS,
  // written against the browser's defaults, so the design system's reset
  // stays out of it
  return (
    <div
      ref={ref}
      data-tds-no-reset
      className={clsx("tjs-map-view", className)}
    />
  );
};

export { MapView };
export type { MapViewer, MapViewProps };
