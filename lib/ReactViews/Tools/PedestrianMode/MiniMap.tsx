import { action, autorun, computed } from "mobx";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import Terria from "../../../Models/Terria";
import ViewerMode from "../../../Models/ViewerMode";
import TerriaViewer from "../../../ViewModels/TerriaViewer";
import Marker from "./Marker";

type MiniMapProps = {
  terria: Terria;
  baseMap: MappableMixin.MappableMixin;
  view: MiniMapView;
};

export type MiniMapView = {
  rectangle: Rectangle;
  position: Cartesian3;
};

const MiniMap: React.FC<MiniMapProps> = props => {
  const { terria, baseMap, view } = props;
  const container = useRef<HTMLDivElement>(null);
  const [miniMapViewer, setMiniMapViewer] = useState<
    TerriaViewer | undefined
  >();
  const [locationMarker, setLocationMarker] = useState<Marker | undefined>();

  useEffect(
    action(() => {
      const marker = new Marker(terria, view.position);
      const viewer = new TerriaViewer(
        terria,
        computed(() => [marker])
      );

      viewer.viewerMode = ViewerMode.Leaflet;
      viewer.disableInteraction = true;
      if (container.current) viewer.attach(container.current);

      viewer.baseMap = baseMap;

      setMiniMapViewer(viewer);
      setLocationMarker(marker);

      return () => viewer.destroy();
    }),
    [terria, baseMap]
  );

  useEffect(() => {
    const disposer = autorun(() => {
      if (miniMapViewer) miniMapViewer.currentViewer.zoomTo(view.rectangle, 0);
      if (locationMarker) locationMarker.position = view.position;
    });
    return disposer;
  }, [miniMapViewer, locationMarker, view]);

  return <MapContainer ref={container} />;
};

const MapContainer = styled.div`
  height: 180px;
  & .leaflet-control-attribution {
    display: none;
  }
`;

/**
 * Convert the camera position to a zoomable rectangle and point
 */
export function getViewFromScene(scene: Scene): MiniMapView {
  const camera = scene.camera;
  // This seem to work for now as a zoom rectangle for leaflet. Consider
  // adapting Cesium.getCurrentCameraView() for a more sophisticated
  // implementation.
  const rectangle = new Rectangle(
    camera.positionCartographic.longitude,
    camera.positionCartographic.latitude,
    camera.positionCartographic.longitude,
    camera.positionCartographic.latitude
  );
  return {
    rectangle,
    position: camera.position
  };
}

export default MiniMap;
