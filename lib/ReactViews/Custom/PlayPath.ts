import { useEffect, useRef, useState, useCallback } from "react";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import HeadingPitchRange from "terriajs-cesium/Source/Core/HeadingPitchRange";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CameraView from "../../Models/CameraView";
import Terria from "../../Models/Terria";

export default function usePlayPath(terria: Terria) {
  const [playSpeed, setPlaySpeed] = useState(1);
  const [playingPath, setPlayingPath] = useState(false);
  const [isCameraMoving, setIsCameraMoving] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const distRef = useRef(0);
  const startIdxRef = useRef(0);
  const reverseRef = useRef(false);
  const playSpeedRef = useRef(playSpeed);
  const abortPlayingPathRef = useRef(false);
  const currentPointIndexRef = useRef(currentPointIndex);

  const getPoints = useCallback(() => {
    const geom = terria.measurableGeomList[terria.measurableGeometryIndex];
    const pts = terria.cesium ? geom.sampledPoints : geom.stopPoints;
    return pts;
  }, [terria]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setPlayingPath(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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
      setIsCameraMoving(false);
    };

    const onMoveStart = () => {
      setIsCameraMoving(true);
    };

    camera.moveStart?.addEventListener(onMoveStart);
    camera.moveEnd.addEventListener(updateDist);

    return () => {
      camera.moveStart?.removeEventListener(onMoveStart);
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
    const cartesians = pts.map((p) => Cartographic.toCartesian(p));
    const useLookAt = Boolean(camera && cartesians.length);
    const pitch = camera?.pitch ?? 0;
    const initialIdx = currentPointIndexRef.current;
    const rawDist = distRef.current;
    const computedDist = camera
      ? Cartesian3.distance(camera.position, cartesians[initialIdx])
      : 0;
    const dist = rawDist > 0 ? rawDist : computedDist;

    const duration = 3 / playSpeedRef.current;
    const isResume = initialIdx !== startIdxRef.current;

    const waitForRender = () =>
      new Promise<boolean>((resolve) => {
        const handler = () => {
          scene?.postRender.removeEventListener(handler);
          resolve(true);
        };
        scene?.postRender.addEventListener(handler);
      });

    const waitForAbort = () =>
      new Promise<boolean>((resolve) => {
        const check = () => {
          if (!abortPlayingPathRef.current) {
            resolve(false);
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });

    const tryStep = async (i: number) => {
      let hpr: HeadingPitchRange | undefined;
      if (
        useLookAt &&
        ((i < pts.length - 1 && !reverseRef.current) ||
          (reverseRef.current && i > 0))
      ) {
        const next = reverseRef.current ? pts[i - 1] : pts[i + 1];
        const heading =
          (new EllipsoidGeodesic(pts[i], next).startHeading +
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
      const rendered = await Promise.race([waitForRender(), waitForAbort()]);
      return rendered;
    };

    const loop = async (start: number, end: number, step: number) => {
      for (let i = start; abortPlayingPathRef.current && i !== end; i += step) {
        if (!(isResume && i === currentPointIndexRef.current)) {
          const ok = await tryStep(i);
          if (!ok) break;
        }
        setCurrentPointIndex(i + step);
        viewer.notifyRepaintRequired();
      }
    };

    if (!reverseRef.current) {
      await loop(currentPointIndexRef.current, pts.length, 1);
    } else {
      const lastIdx = pts.length - 1;
      await loop(Math.min(currentPointIndexRef.current, lastIdx), -1, -1);
    }

    setPlayingPath(false);
  }, [getPoints, terria]);

  const onPlay = () => {
    const pts = getPoints();
    const camera = terria.cesium?.scene.camera;
    if (!pts?.length || !camera) return;
    if (currentPointIndex !== startIdxRef.current && !playingPath) {
      setPlayingPath(true);
      return;
    }
    const cartesian = pts.map((p) => Cartographic.toCartesian(p));
    const distFirst = Cartesian3.distance(camera.position, cartesian[0]);
    const distLast = Cartesian3.distance(camera.position, cartesian.at(-1)!);
    reverseRef.current = distFirst > distLast;
    startIdxRef.current = reverseRef.current ? pts.length - 1 : 0;
    setCurrentPointIndex(startIdxRef.current);
    setCountdown(3);
  };

  const onPause = () => {
    abortPlayingPathRef.current = false;
    setPlayingPath(false);
  };

  const onStop = () => {
    abortPlayingPathRef.current = false;
    setPlayingPath(false);
    const pts = getPoints();
    const camera = terria.cesium?.scene.camera;
    if (!pts?.length || !camera) return;
    const targetIdx = startIdxRef.current;
    const point = pts[targetIdx];
    const dist = Cartesian3.distance(
      camera.position,
      Cartographic.toCartesian(point)
    );
    const pitch = camera.pitch ?? 0;
    let hpr: HeadingPitchRange | undefined;
    if (pts.length > 1) {
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
    if (playingPath) playPath();
  }, [playingPath, playPath]);

  return {
    playSpeed,
    setPlaySpeed,
    playingPath,
    isCameraMoving,
    countdown,
    currentPointIndex,
    onPlay,
    onPause,
    onStop
  };
}
