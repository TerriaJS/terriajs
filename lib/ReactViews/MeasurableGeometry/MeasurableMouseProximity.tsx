import { useEffect, useState } from "react";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import { observer } from "mobx-react";
import isDefined from "../../Core/isDefined";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import MeasurablePanelManager from "../Custom/MeasurablePanelManager";
import SceneTransforms from "terriajs-cesium/Source/Scene/SceneTransforms";

interface Props {
  terria: Terria;
  viewState: ViewState;
  measurablePanelIsVisible: boolean;
  onHighlightedRowChange: (idx: number | null) => void;
}

type CachedGeometryPoints = {
  stopPoints: Cartesian3[];
  sampledPoints: Cartesian3[];
};

const MeasurableMouseProximity = observer((props: Props) => {
  const {
    terria,
    viewState,
    measurablePanelIsVisible,
    onHighlightedRowChange
  } = props;

  const currentGeom = terria.measurableGeomList[terria.measurableGeometryIndex];
  const [cachedPoints, setCachedPoints] = useState<CachedGeometryPoints | null>(
    null
  );

  useEffect(() => {
    const scene = terria.cesium?.scene;
    const ellipsoid = scene?.globe?.ellipsoid;
    const terrainProvider = scene?.globe?.terrainProvider;

    if (!currentGeom || !scene || !ellipsoid) {
      setCachedPoints(null);
      return;
    }

    let active = true;

    const toCartesianFallback = (points: Cartographic[]) =>
      points.map((p) =>
        Cartesian3.fromRadians(
          p.longitude,
          p.latitude,
          p.height ?? 0,
          ellipsoid
        )
      );

    const sampleAndCache = async () => {
      const stopSource = currentGeom.stopPoints ?? [];
      const sampledSource =
        currentGeom.onlyPoints === false ? currentGeom.sampledPoints ?? [] : [];

      const fallback = {
        stopPoints: toCartesianFallback(stopSource),
        sampledPoints: toCartesianFallback(sampledSource)
      };

      setCachedPoints(fallback);

      if (!terrainProvider) return;

      try {
        const [sampledStops, sampledSamples] = await Promise.all([
          sampleTerrainMostDetailed(
            terrainProvider,
            stopSource.map((p) => Cartographic.clone(p))
          ),
          currentGeom.onlyPoints === false
            ? sampleTerrainMostDetailed(
                terrainProvider,
                sampledSource.map((p) => Cartographic.clone(p))
              )
            : Promise.resolve([])
        ]);

        if (!active) return;

        setCachedPoints({
          stopPoints: sampledStops.map((p) =>
            Cartesian3.fromRadians(
              p.longitude,
              p.latitude,
              p.height ?? 0,
              ellipsoid
            )
          ),
          sampledPoints:
            currentGeom.onlyPoints === false
              ? sampledSamples.map((p) =>
                  Cartesian3.fromRadians(
                    p.longitude,
                    p.latitude,
                    p.height ?? 0,
                    ellipsoid
                  )
                )
              : []
        });
      } catch {
        if (!active) return;
      }
    };

    void sampleAndCache();

    return () => {
      active = false;
    };
  }, [currentGeom, terria.cesium]);

  useEffect(() => {
    if (!measurablePanelIsVisible) return;

    const handleMouseProximity = () => {
      const scene = terria?.cesium?.scene;
      const ellipsoid = scene?.globe?.ellipsoid;
      if (!scene || !ellipsoid) return;

      const mouseCoords = terria.currentViewer.mouseCoords.cartographic;
      const currentGeometry =
        terria.measurableGeomList[terria.measurableGeometryIndex];

      if (
        !mouseCoords ||
        !terria.measurableGeomList ||
        !currentGeometry ||
        !cachedPoints
      ) {
        return;
      }

      const isPointerOverChart = MeasurablePanelManager.isPointerOverChart();

      const findNearestPointInRangeScreen = (
        points: Cartesian3[],
        mouseCoords: Cartographic,
        pixelRadius: number
      ): { point: Cartesian3; idx: number } | null => {
        if (!points.length) return null;

        const scene = terria?.cesium?.scene;
        const ellipsoid = scene?.globe?.ellipsoid;
        if (!scene || !ellipsoid) return null;

        const mouseCartesian = Cartesian3.fromRadians(
          mouseCoords.longitude,
          mouseCoords.latitude,
          mouseCoords.height ?? 0,
          ellipsoid
        );

        const mouseWindowPos = SceneTransforms.wgs84ToWindowCoordinates(
          scene,
          mouseCartesian
        );
        if (!isDefined(mouseWindowPos)) return null;

        let nearestPoint: Cartesian3 | null = null;
        let nearestIdx: number | null = null;
        let nearestDistanceSquared = Number.POSITIVE_INFINITY;
        const radiusSquared = pixelRadius * pixelRadius;

        for (let idx = 0; idx < points.length; idx++) {
          const pointCartesian = points[idx];

          const windowPos = SceneTransforms.wgs84ToWindowCoordinates(
            scene,
            pointCartesian
          );
          if (!isDefined(windowPos)) continue;

          const dx = windowPos.x - mouseWindowPos.x;
          const dy = windowPos.y - mouseWindowPos.y;
          const distanceSquared = dx * dx + dy * dy;

          if (
            distanceSquared <= radiusSquared &&
            distanceSquared < nearestDistanceSquared
          ) {
            nearestDistanceSquared = distanceSquared;
            nearestPoint = pointCartesian;
            nearestIdx = idx;
          }
        }

        if (nearestPoint && nearestIdx !== null) {
          return { point: nearestPoint, idx: nearestIdx };
        }

        return null;
      };

      const proximityPixels = 10;
      const clearProximityPixels = 14;

      const sampledNearby =
        currentGeometry?.onlyPoints === false
          ? findNearestPointInRangeScreen(
              cachedPoints.sampledPoints,
              mouseCoords,
              proximityPixels
            )
          : null;

      if (sampledNearby) {
        viewState.setSelectedSampledPointIdx(sampledNearby.idx);
      } else if (!isPointerOverChart) {
        viewState.setSelectedSampledPointIdx(null);
      }

      const stopNearby = findNearestPointInRangeScreen(
        cachedPoints.stopPoints,
        mouseCoords,
        proximityPixels
      );

      if (stopNearby) {
        onHighlightedRowChange(stopNearby.idx);
        viewState.setSelectedStopPointIdx(stopNearby.idx);
      } else if (!isPointerOverChart) {
        onHighlightedRowChange(null);
        viewState.setSelectedStopPointIdx(null);
      }

      const stopFar = findNearestPointInRangeScreen(
        cachedPoints.stopPoints,
        mouseCoords,
        clearProximityPixels
      );

      const sampledFar =
        currentGeometry?.onlyPoints === false
          ? findNearestPointInRangeScreen(
              cachedPoints.sampledPoints,
              mouseCoords,
              clearProximityPixels
            )
          : null;

      const mouseDefinitelyOutside = !stopFar && !sampledFar;

      const markerPoint = stopNearby?.point ?? sampledNearby?.point;

      if (markerPoint) {
        const markerCartographic = Cartographic.fromCartesian(
          markerPoint,
          ellipsoid
        );
        MeasurablePanelManager.addMarker(markerCartographic);
      } else if (mouseDefinitelyOutside && !isPointerOverChart) {
        viewState.setSelectedStopPointIdx(null);
        MeasurablePanelManager.removeAllMarkers();
      }

      terria.currentViewer.notifyRepaintRequired();
    };

    let animationFrameId: number | null = null;

    const scheduleMouseProximity = () => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        handleMouseProximity();
      });
    };

    const disposer =
      terria.currentViewer.mouseCoords.updateEvent.addEventListener(
        scheduleMouseProximity
      );

    return () => {
      disposer();
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    viewState,
    terria.cesium,
    terria.currentViewer,
    terria.measurableGeomList,
    terria.measurableGeometryIndex,
    currentGeom,
    measurablePanelIsVisible,
    onHighlightedRowChange,
    cachedPoints
  ]);

  return null;
});

export default MeasurableMouseProximity;
