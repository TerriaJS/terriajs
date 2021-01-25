import { action, autorun, computed } from "mobx";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import PerspectiveFrustum from "terriajs-cesium/Source/Core/PerspectiveFrustum";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import Terria from "../../../Models/Terria";
import ViewerMode from "../../../Models/ViewerMode";
import TerriaViewer from "../../../ViewModels/TerriaViewer";
import Marker from "./Marker";

type MiniMapProps = {
  terria: Terria;
  view: MiniMapView;
};

export type MiniMapView = {
  rectangle: Rectangle;
  position: Cartesian3;
};

const MiniMap: React.FC<MiniMapProps> = props => {
  const { terria, view } = props;
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

      viewer.baseMap = terria.mainViewer.baseMap;

      setMiniMapViewer(viewer);
      setLocationMarker(marker);

      return () => viewer.destroy();
    }),
    []
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

const cartesian3Scratch = new Cartesian3();
const enuToFixedScratch = new Matrix4();
const southwestScratch = new Cartesian3();
const southeastScratch = new Cartesian3();
const northeastScratch = new Cartesian3();
const northwestScratch = new Cartesian3();
const southwestCartographicScratch = new Cartographic();
const southeastCartographicScratch = new Cartographic();
const northeastCartographicScratch = new Cartographic();
const northwestCartographicScratch = new Cartographic();

export function getViewFromScene(scene: Scene): MiniMapView {
  const camera = scene.camera;
  const ellipsoid = scene.globe.ellipsoid;

  const frustrum = scene.camera.frustum as PerspectiveFrustum;

  const fovy = frustrum.fovy * 0.5;
  const fovx = Math.atan(Math.tan(fovy) * frustrum.aspectRatio);

  const center = camera.positionWC.clone();
  const cameraOffset = Cartesian3.subtract(
    camera.positionWC,
    center,
    cartesian3Scratch
  );
  const cameraHeight = Cartesian3.magnitude(cameraOffset);
  const xDistance = cameraHeight * Math.tan(fovx);
  const yDistance = cameraHeight * Math.tan(fovy);

  const southwestEnu = new Cartesian3(-xDistance, -yDistance, 0.0);
  const southeastEnu = new Cartesian3(xDistance, -yDistance, 0.0);
  const northeastEnu = new Cartesian3(xDistance, yDistance, 0.0);
  const northwestEnu = new Cartesian3(-xDistance, yDistance, 0.0);

  const enuToFixed = Transforms.eastNorthUpToFixedFrame(
    center,
    ellipsoid,
    enuToFixedScratch
  );
  const southwest = Matrix4.multiplyByPoint(
    enuToFixed,
    southwestEnu,
    southwestScratch
  );
  const southeast = Matrix4.multiplyByPoint(
    enuToFixed,
    southeastEnu,
    southeastScratch
  );
  const northeast = Matrix4.multiplyByPoint(
    enuToFixed,
    northeastEnu,
    northeastScratch
  );
  const northwest = Matrix4.multiplyByPoint(
    enuToFixed,
    northwestEnu,
    northwestScratch
  );
  const southwestCartographic = ellipsoid.cartesianToCartographic(
    southwest,
    southwestCartographicScratch
  );
  const southeastCartographic = ellipsoid.cartesianToCartographic(
    southeast,
    southeastCartographicScratch
  );
  const northeastCartographic = ellipsoid.cartesianToCartographic(
    northeast,
    northeastCartographicScratch
  );
  const northwestCartographic = ellipsoid.cartesianToCartographic(
    northwest,
    northwestCartographicScratch
  );

  // Account for date-line wrapping
  if (southeastCartographic.longitude < southwestCartographic.longitude) {
    southeastCartographic.longitude += CesiumMath.TWO_PI;
  }
  if (northeastCartographic.longitude < northwestCartographic.longitude) {
    northeastCartographic.longitude += CesiumMath.TWO_PI;
  }

  const rectangle = new Rectangle(
    CesiumMath.convertLongitudeRange(
      Math.min(southwestCartographic.longitude, northwestCartographic.longitude)
    ),
    Math.min(southwestCartographic.latitude, southeastCartographic.latitude),
    CesiumMath.convertLongitudeRange(
      Math.max(northeastCartographic.longitude, southeastCartographic.longitude)
    ),
    Math.max(northeastCartographic.latitude, northwestCartographic.latitude)
  );

  // center isn't a member variable and doesn't seem to be used anywhere else in Terria
  // rect.center = center;
  return {
    rectangle,
    position: camera.position
  };
}

export default MiniMap;
