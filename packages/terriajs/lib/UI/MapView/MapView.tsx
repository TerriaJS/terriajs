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

  return <div ref={ref} className={clsx("tjs-map-view", className)} />;
};

export { MapView };
export type { MapViewer, MapViewProps };
