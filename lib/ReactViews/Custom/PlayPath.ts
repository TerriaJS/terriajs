import { useEffect, useRef, useState, useCallback } from "react";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import HeadingPitchRange from "terriajs-cesium/Source/Core/HeadingPitchRange";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CameraView from "../../Models/CameraView";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import ViewerMode from "../../Models/ViewerMode";
import { runInAction } from "mobx";

export default function usePlayPath(terria: Terria, viewState: ViewState) {
  const [playSpeed, setPlaySpeed] = useState(1);
  const [isCameraMoving, setIsCameraMoving] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [indeterminate, setIndeterminate] = useState(false);

  const [isPitchTooLowState, setIsPitchTooLowState] = useState(false);

  const distRef = useRef(0);
  const startIdxRef = useRef(0);
  const reverseRef = useRef(false);
  const playSpeedRef = useRef(playSpeed);
  const abortPlayingPathRef = useRef(false);
  const currentPointIndexRef = useRef(currentPointIndex);
  const loadPercentageRef = useRef(loadPercentage);

  const lastPitchCheckRef = useRef(0);

  const checkAndUpdatePitch = useCallback(() => {
    const camera = terria.cesium?.scene.camera;
    if (!camera || terria.currentViewer.type === "Leaflet") {
      setIsPitchTooLowState(false);
      return;
    }

    const currentPitch = Math.abs(camera.pitch ?? 0);
    const thresholdRadians = CesiumMath.toRadians(
      terria.configParameters.playPathCameraPitchThreshold!
    );

    const isPitchLow = currentPitch < thresholdRadians;
    const now = Date.now();

    if (now - lastPitchCheckRef.current > 50) {
      lastPitchCheckRef.current = now;
    }

    setIsPitchTooLowState(isPitchLow);
  }, [terria]);

  const isPitchTooLow = useCallback(() => {
    return isPitchTooLowState;
  }, [isPitchTooLowState]);

  const resetPlayPath = useCallback(() => {
    if (viewState.isPlayingPath) {
      abortPlayingPathRef.current = false;
      runInAction(() => {
        viewState.isPlayingPath = false;
      });
    }

    setCurrentPointIndex(0);
    setCountdown(null);
    setIsCameraMoving(false);
    startIdxRef.current = 0;
    reverseRef.current = false;
    currentPointIndexRef.current = 0;

    checkAndUpdatePitch();
  }, [viewState, checkAndUpdatePitch]);

  const getPoints = useCallback(() => {
    const geom = terria.measurableGeomList[terria.measurableGeometryIndex];
    if (!geom) return;

    const isCesium2D = terria.mainViewer.viewerMode === ViewerMode.Cesium2D;

    const pts = isCesium2D
      ? geom.stopPoints
      : terria.cesium
      ? geom.sampledPoints
      : geom.stopPoints;

    if (!pts || pts.length === 0) return;

    return pts;
  }, [terria]);

  useEffect(() => {
    const camera = terria.cesium?.scene.camera;
    if (!camera) return;

    checkAndUpdatePitch();

    const onCameraChanged = () => {
      checkAndUpdatePitch();
    };

    const onCameraMoveStart = () => {
      setIsCameraMoving(true);
    };

    const onCameraMoveEnd = () => {
      setIsCameraMoving(false);
      checkAndUpdatePitch();
    };

    camera.changed.addEventListener(onCameraChanged);
    camera.moveStart?.addEventListener(onCameraMoveStart);
    camera.moveEnd.addEventListener(onCameraMoveEnd);

    return () => {
      camera.changed.removeEventListener(onCameraChanged);
      camera.moveStart?.removeEventListener(onCameraMoveStart);
      camera.moveEnd.removeEventListener(onCameraMoveEnd);
    };
  }, [terria, checkAndUpdatePitch]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!viewState.isPlayingPath) {
        checkAndUpdatePitch();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [checkAndUpdatePitch, viewState.isPlayingPath]);

  useEffect(() => {
    const onProgress = (remaining: number, max: number) => {
      const raw = (1 - remaining / max) * 100;
      const percentage =
        remaining === 0 || isNaN(raw) ? 100 : Math.min(100, Math.floor(raw));

      loadPercentageRef.current = percentage;
      setLoadPercentage(percentage);
    };

    const onIndeterminate = (mode: boolean) => setIndeterminate(mode);

    terria.tileLoadProgressEvent.addEventListener(onProgress);
    terria.indeterminateTileLoadProgressEvent.addEventListener(onIndeterminate);

    return () => {
      terria.tileLoadProgressEvent.removeEventListener(onProgress);
      terria.indeterminateTileLoadProgressEvent.removeEventListener(
        onIndeterminate
      );
    };
  }, [terria]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      runInAction(() => {
        viewState.isPlayingPath = true;
      });
      return;
    }
    const timer = window.setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, viewState]);

  useEffect(() => {
    currentPointIndexRef.current = currentPointIndex;
  }, [currentPointIndex]);

  useEffect(() => {
    playSpeedRef.current = playSpeed;
  }, [playSpeed]);

  useEffect(() => {
    const camera = terria.cesium?.scene.camera;
    if (!camera) return;

    const updateDist = () => {
      const pts = getPoints();
      if (!pts?.length) return;
      const cartesians = pts.map((p) => Cartographic.toCartesian(p));
      const idx = currentPointIndexRef.current;
      distRef.current = Cartesian3.distance(camera.position, cartesians[idx]);
    };

    camera.moveEnd.addEventListener(updateDist);

    return () => {
      camera.moveEnd.removeEventListener(updateDist);
    };
  }, [getPoints, terria]);

  const playPath = useCallback(async () => {
    abortPlayingPathRef.current = true;
    const pts = getPoints();
    if (!pts?.length) return;
    const scene = terria.cesium?.scene;
    const camera = scene?.camera;
    const viewer = terria.currentViewer;
    const isLeafletViewer = viewer.type === "Leaflet";
    const cartesians = pts.map((p) => Cartographic.toCartesian(p));
    const useLookAt = Boolean(camera && cartesians.length);
    const isCesium2D = terria.mainViewer.viewerMode === ViewerMode.Cesium2D;
    const pitch = camera?.pitch ?? 0;
    const initialIdx = currentPointIndexRef.current;

    let dist = 1000;
    if (camera) {
      const isCesium2D = terria.mainViewer.viewerMode === ViewerMode.Cesium2D;
      if (isCesium2D) {
        dist = camera.positionCartographic.height || 1000;
      } else {
        const cameraTrueCartesian = Cartographic.toCartesian(
          camera.positionCartographic
        );
        dist = Cartesian3.distance(cameraTrueCartesian, cartesians[initialIdx]);
      }
    }

    const isResume = initialIdx !== startIdxRef.current;

    const waitForProgressComplete = () =>
      new Promise<"loaded">((resolve) => {
        if (loadPercentageRef.current === 100 && !indeterminate) {
          resolve("loaded");
          return;
        }
        const onProg = () => {
          if (loadPercentageRef.current === 100 && !indeterminate) {
            terria.tileLoadProgressEvent.removeEventListener(onProg);
            resolve("loaded");
          }
        };
        terria.tileLoadProgressEvent.addEventListener(onProg);
      });

    const waitForLeafletFlight = (durationSeconds: number) =>
      new Promise<"loaded">((resolve) => {
        window.setTimeout(() => {
          resolve("loaded");
        }, durationSeconds * 1000);
      });

    const waitForAbort = () =>
      new Promise<"abort">((resolve) => {
        const check = () => {
          if (!abortPlayingPathRef.current) {
            resolve("abort");
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });

    const tryStep = async (i: number) => {
      const duration = 2 / playSpeedRef.current;
      let hpr: HeadingPitchRange | undefined;
      const isForwardStep = !reverseRef.current;
      const hasNextPoint = isForwardStep ? i < pts.length - 1 : i > 0;
      const isTerminalStep = isForwardStep ? i === pts.length - 1 : i === 0;

      if (useLookAt && hasNextPoint) {
        const next = isForwardStep ? pts[i + 1] : pts[i - 1];
        const heading =
          (new EllipsoidGeodesic(pts[i], next).startHeading +
            CesiumMath.TWO_PI) %
          CesiumMath.TWO_PI;
        hpr = new HeadingPitchRange(heading, -pitch, dist);
      } else if (useLookAt && isCesium2D && isTerminalStep && pts.length > 1) {
        const previous = isForwardStep ? pts[i - 1] : pts[i + 1];
        const heading =
          (new EllipsoidGeodesic(previous, pts[i]).startHeading +
            CesiumMath.TWO_PI) %
          CesiumMath.TWO_PI;
        hpr = new HeadingPitchRange(heading, -pitch, dist);
      }

      await viewer.doZoomTo(
        useLookAt && hpr
          ? CameraView.fromLookAt(pts[i], hpr)
          : Rectangle.fromCartographicArray([pts[i]]),
        duration
      );
      const result = await Promise.race([
        isLeafletViewer
          ? waitForLeafletFlight(duration)
          : waitForProgressComplete(),
        waitForAbort()
      ]);

      if (result === "abort") {
        return false;
      }

      return true;
    };

    const loop = async (start: number, end: number, step: number) => {
      for (let i = start; abortPlayingPathRef.current && i !== end; i += step) {
        if (!(isResume && i === currentPointIndexRef.current)) {
          const ok = await tryStep(i);
          if (!ok) break;
        }

        const nextIndex = i + step;

        if (nextIndex === end || nextIndex < 0 || nextIndex >= pts.length) {
          const finalIndex = step > 0 ? pts.length - 1 : 0;
          setCurrentPointIndex(finalIndex);
          break;
        }

        setCurrentPointIndex(nextIndex);
        viewer.notifyRepaintRequired();
      }
    };

    if (!reverseRef.current) {
      await loop(currentPointIndexRef.current, pts.length, 1);
    } else {
      const lastIdx = pts.length - 1;
      await loop(Math.min(currentPointIndexRef.current, lastIdx), -1, -1);
    }

    runInAction(() => {
      viewState.isPlayingPath = false;
    });
  }, [getPoints, terria, viewState, indeterminate]);

  const onPlay = () => {
    const pts = getPoints();
    const camera = terria.cesium?.scene.camera;
    if (!pts?.length) return;

    if (
      !viewState.isPlayingPath &&
      !(currentPointIndex === 0 || currentPointIndex === pts.length - 1)
    ) {
      runInAction(() => {
        viewState.isPlayingPath = true;
      });
      return;
    }
    if (camera) {
      const cartesian = pts.map((p) => Cartographic.toCartesian(p));
      const cameraTrueCartesian = Cartographic.toCartesian(
        camera.positionCartographic
      );
      const distFirst = Cartesian3.distance(cameraTrueCartesian, cartesian[0]);
      const distLast = Cartesian3.distance(
        cameraTrueCartesian,
        cartesian.at(-1)!
      );
      reverseRef.current = distFirst > distLast;
    } else {
      const view = terria.currentViewer.getCurrentCameraView();
      const viewCenter = Rectangle.center(view.rectangle);
      const viewCenterCartesian = Cartographic.toCartesian(viewCenter);
      const cartesian = pts.map((p) => Cartographic.toCartesian(p));
      const distFirst = Cartesian3.distance(viewCenterCartesian, cartesian[0]);
      const distLast = Cartesian3.distance(
        viewCenterCartesian,
        cartesian.at(-1)!
      );
      reverseRef.current = distFirst > distLast;
    }
    startIdxRef.current = reverseRef.current ? pts.length - 1 : 0;
    setCurrentPointIndex(startIdxRef.current);
    setCountdown(3);
  };

  const onPause = () => {
    abortPlayingPathRef.current = false;
    runInAction(() => {
      viewState.isPlayingPath = false;
    });
  };

  const onStop = () => {
    abortPlayingPathRef.current = false;
    runInAction(() => {
      viewState.isPlayingPath = false;
    });
    const pts = getPoints();
    const camera = terria.cesium?.scene.camera;
    if (!pts?.length) return;
    const targetIdx = startIdxRef.current;
    reverseRef.current = startIdxRef.current === pts.length - 1;
    const point = pts[targetIdx];
    let hpr: HeadingPitchRange | undefined;
    if (camera && pts.length > 1) {
      const isCesium2D = terria.mainViewer.viewerMode === ViewerMode.Cesium2D;
      const cameraTrueCartesian = Cartographic.toCartesian(
        camera.positionCartographic
      );
      const dist = isCesium2D
        ? camera.positionCartographic.height || 1000
        : Cartesian3.distance(
            cameraTrueCartesian,
            Cartographic.toCartesian(point)
          );
      const pitch = camera.pitch ?? 0;
      const neighborIdx = reverseRef.current ? targetIdx - 1 : targetIdx + 1;
      const heading =
        (new EllipsoidGeodesic(point, pts[neighborIdx]).startHeading +
          CesiumMath.TWO_PI) %
        CesiumMath.TWO_PI;
      hpr = new HeadingPitchRange(heading, -pitch, dist);
    }
    const duration = 3 / playSpeedRef.current;
    terria.currentViewer.doZoomTo(
      hpr
        ? CameraView.fromLookAt(point, hpr)
        : Rectangle.fromCartographicArray([point]),
      duration
    );
    setCurrentPointIndex(targetIdx);
    terria.currentViewer.notifyRepaintRequired();
  };

  useEffect(() => {
    if (viewState.isPlayingPath) playPath();
  }, [viewState.isPlayingPath, playPath]);

  return {
    playSpeed,
    setPlaySpeed,
    playingPath: viewState.isPlayingPath,
    isCameraMoving,
    countdown,
    currentPointIndex,
    pointsSize: getPoints()?.length,
    onPlay,
    onPause,
    onStop,
    resetPlayPath,
    isPitchTooLow
  };
}
