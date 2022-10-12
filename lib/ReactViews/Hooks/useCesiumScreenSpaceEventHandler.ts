import { useEffect, useState } from "react";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import { useViewState } from "../StandardUserInterface/ViewStateContext";

/**
 * A hook to create Cesium ScreenSpaceEventHandler for the current Cesium instance.
 * The handler is destroyed automatically after use.
 *
 * @returns ScreenSpaceEventHandler or `undefined` if one cannot be created.
 */
export default function useCesiumScreenSpaceEventHandler():
  | ScreenSpaceEventHandler
  | undefined {
  const viewState = useViewState();
  const cesium = viewState.terria.cesium;
  const [eventHandler, setEventHandler] = useState<
    ScreenSpaceEventHandler | undefined
  >(undefined);

  useEffect(() => {
    console.log("*here - useCesiumScreenSpaceEventHandler*");
    const handler = cesium
      ? new ScreenSpaceEventHandler(cesium.scene.canvas)
      : undefined;
    setEventHandler(handler);
    return () => handler?.destroy();
  }, [cesium]);

  return eventHandler;
}
