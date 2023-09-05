import { action } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import {
  BoxDrawing,
  CatalogMemberMixin,
  CommonStrata,
  LatLonHeightTraits,
  ViewState
} from "terriajs-plugin-api";
import ClippingMixin from "../../../ModelMixins/ClippingMixin";
import Cesium from "../../../Models/Cesium";
import Text from "../../../Styled/Text";

type ItemType = ClippingMixin.Instance &
  CatalogMemberMixin.Instance & { clippingBoxDrawing: BoxDrawing };

interface PropsType {
  viewState: ViewState;
  cesium: Cesium;
  item: ItemType;
}

const pickScratch = new Cartesian3();

/**
 * A tool for repositioning the clipping box.
 *
 * It moves the clipping box to follow the mouse and places it where the user has clicked.
 * Action can be cancelled by pressing Escape button.
 */
const RepositionClippingBox: React.FC<PropsType> = observer(
  ({ cesium, item }) => {
    const promptRef: React.Ref<HTMLDivElement> = useRef(null);

    // End repositioning
    const endRepositioning = action((item: ItemType) => {
      item.repositionClippingBoxTrigger = false;

      // A hacky way to re-compute the boxDrawing so that it gets reset to the
      // saved trait position.
      item.clippingBox.setTrait(CommonStrata.user, "showClippingBox", false);
      window.setTimeout(
        action(() =>
          item.clippingBox.setTrait(CommonStrata.user, "showClippingBox", true)
        ),
        100
      );
    });

    // Move the clipping box and cursor prompt to follow the mouse
    const moveItem = (
      item: ItemType,
      canvasCursorPos: Cartesian2,
      cesium: Cesium
    ) => {
      const prompt = promptRef.current;
      if (prompt === null) {
        return;
      }

      const pickPosition = pickGlobePosition(
        canvasCursorPos,
        cesium.scene,
        pickScratch
      );
      if (!pickPosition) {
        return;
      }

      const rect = cesium.scene.canvas.getBoundingClientRect();
      const offset = 10; // 10px away from the cursor
      const left = canvasCursorPos.x + rect.left + offset;
      const top = canvasCursorPos.y + rect.top + offset;

      if (left <= rect.left) {
        return;
      }

      prompt.style.left = `${left}px`;
      prompt.style.top = `${top}px`;

      const boxDrawing = item.clippingBoxDrawing;
      // A hacky way to set boxDrawing position without setting the traits and
      // consequently triggering expensive recomputation
      boxDrawing.setPosition(pickPosition);
      boxDrawing.onChange?.({
        isFinished: false,
        modelMatrix: (boxDrawing as any).modelMatrix,
        translationRotationScale: (boxDrawing as any).trs
      });
    };

    // Place the clipping box at the screen position
    const placeItem = (
      item: ItemType,
      screenPosition: Cartesian2,
      cesium: Cesium
    ) => {
      const position = pickGlobePosition(
        screenPosition,
        cesium.scene,
        pickScratch
      );
      if (!position) {
        return false;
      }

      LatLonHeightTraits.setFromCartesian(
        item.clippingBox.position,
        CommonStrata.user,
        position
      );
      return true;
    };

    // Init effect that sets up the event handlers etc.
    useEffect(
      action(function init() {
        const canvas = cesium.scene.canvas;
        (item.clippingBoxDrawing as any).stopInteractions();
        setCursor(canvas, "move");
        cesium.isFeaturePickingPaused = true;
        if (promptRef.current) setCursor(promptRef.current, "grabbing");

        const inputHandler = new ScreenSpaceEventHandler(canvas);
        inputHandler.setInputAction(({ endPosition }) => {
          moveItem(item, endPosition, cesium);
        }, ScreenSpaceEventType.MOUSE_MOVE);

        inputHandler.setInputAction(
          ({ position }) =>
            placeItem(item, position, cesium) && endRepositioning(item),
          ScreenSpaceEventType.LEFT_CLICK
        );

        const escapeKeyHandler = (ev: KeyboardEvent) =>
          ev.key === "Escape" && endRepositioning(item);
        document.addEventListener("keydown", escapeKeyHandler);

        return function destroy() {
          inputHandler.destroy();
          setCursor(canvas, "auto");
          if (promptRef.current) setCursor(promptRef.current, "auto");
          if (item.clippingBoxDrawing.dataSource.show) {
            (item.clippingBoxDrawing as any).startInteractions();
          }
          document.removeEventListener("keydown", escapeKeyHandler);
          cesium.isFeaturePickingPaused = false;
          endRepositioning(item);
        };
      }),
      [item, cesium]
    );

    const initialX = window.innerWidth / 2;
    const initualY = window.innerHeight / 2;
    const name = truncate(item.name ?? "", 10);
    return (
      <CursorPrompt ref={promptRef} x={initialX} y={initualY}>
        <Text medium>
          Click on map to place clipping box for model "{name}"
        </Text>
        <Text small>(Press Esc to cancel)</Text>
      </CursorPrompt>
    );
  }
);

interface CursorPromptProps {
  x: number;
  y: number;
}

const CursorPrompt = styled.div.attrs<CursorPromptProps>(({ x, y }) => ({
  style: {
    left: x + 10,
    top: y + 10
  }
}))<CursorPromptProps>`
  position: absolute;
  overflow: visible;
  white-space: nowrap;
  max-width: 500px;
  background-color: rgba(255, 165, 0, 0.7);
  padding: 7px;
  border: 1px solid white;
`;

function setCursor(el: HTMLElement, cursorName: string) {
  el.style.cursor = cursorName;
}

function truncate(text: string, length: number) {
  return text.length <= length ? text : `${text.slice(0, length)}...`;
}

function pickGlobePosition(
  screenCoords: Cartesian2,
  scene: Scene,
  result?: Cartesian3
): Cartesian3 | undefined {
  const pickRay = scene.camera.getPickRay(screenCoords);
  return pickRay ? scene.globe.pick(pickRay, scene, result) : undefined;
}

export default RepositionClippingBox;
