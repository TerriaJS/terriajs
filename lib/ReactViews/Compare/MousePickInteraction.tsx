import { action, reaction } from "mobx";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import PickedFeatures from "../../Map/PickedFeatures";
import MapInteractionMode, { UIMode } from "../../Models/MapInteractionMode";
import Terria from "../../Models/Terria";
import Text from "../../Styled/Text";

type PropsType = {
  terria: Terria;
  onLoadingPick: () => void;
  onFinishPick: (pickedFeatures: PickedFeatures | undefined) => void;
  onCancelPick: () => void;
};

/**
 * A component implementing the mouse pick interaction using MapInteractionMode.
 */
const MousePickInteraction: React.FC<PropsType> = props => {
  const currentPick = useRef<PickedFeatures | undefined>(undefined);
  const mapContainer = getHTMLElement(props.terria.mainViewer.mapContainer);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  useEffect(() => {
    const disposer = setupPickInteractionMode(
      props.terria,
      async (pickedFeatures: PickedFeatures | undefined) => {
        props.onLoadingPick();
        currentPick.current = pickedFeatures;
        setShowTooltip(false);
        await pickedFeatures?.allFeaturesAvailablePromise;
        if (currentPick.current === pickedFeatures) {
          props.onFinishPick(pickedFeatures);
          currentPick.current = undefined;
        }
      }
    );
    return () => {
      disposer();
      currentPick.current = undefined;
    };
  }, []);

  useEffect(function cancelPick() {
    const cancelPicking = props.onCancelPick;
    const cancelPickingIfTargetIsNotMap = (ev: MouseEvent) => {
      if (ev.target !== mapContainer) {
        cancelPicking();
      }
    };

    document.addEventListener("contextmenu", cancelPicking);
    document.addEventListener("mousedown", cancelPickingIfTargetIsNotMap);
    return () => {
      document.removeEventListener("contextmenu", cancelPicking);
      document.removeEventListener("mousedown", cancelPickingIfTargetIsNotMap);
    };
  });

  return (
    <>
      {mapContainer && showTooltip && (
        <MouseTooltip mapContainer={mapContainer} />
      )}
    </>
  );
};

type MouseTooltipProps = {
  mapContainer: HTMLElement;
};

/**
 * Shows a tooltip that follows the mouse
 */
const MouseTooltip: React.FC<MouseTooltipProps> = ({ mapContainer }) => {
  const [t] = useTranslation();
  const [mousePosition, setMousePosition] = useState<
    { x: number; y: number } | undefined
  >();

  useEffect(function onMount() {
    const listener = (ev: MouseEvent) =>
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    mapContainer.addEventListener("mousemove", listener);
    mapContainer.style.cursor = "crosshair";
    return function onUnmount() {
      mapContainer.removeEventListener("mousemove", listener);
      mapContainer.style.cursor = "auto";
    };
  }, []);

  return (
    <>
      {mousePosition && (
        <Tooltip {...mousePosition}>
          <Text bold textAlignCenter>
            {t("compare.dateLocationFilter.mouseTooltipTitle")}
          </Text>
          <Text light>
            {t("compare.dateLocationFilter.mouseTooltipMessage")}
          </Text>
        </Tooltip>
      )}
    </>
  );
};

const Tooltip = styled.div.attrs<{
  x: number;
  y: number;
}>(props => ({
  style: { left: props.x + 10, top: props.y + 10 }
}))`
  position: fixed;
  background: white;
  padding: 5px;
  border-radius: 3px;
`;

/**
 * Setsup the pick interaction mode returning a function to dispose the interaction.
 */
const setupPickInteractionMode = action(
  (terria: Terria, callback: (pick: PickedFeatures | undefined) => void) => {
    // Add a new map interaction mode
    const pickMode = new MapInteractionMode({
      message: "foo",
      messageAsNode: <div></div>,
      uiMode: UIMode.Difference,
      ignoreSplitterWhenPicking: true
    });
    terria.mapInteractionModeStack.push(pickMode);

    // Setup a reaction to watch picking
    const reactionDisposer = reaction(
      () => pickMode.pickedFeatures,
      (pick: PickedFeatures | undefined) => {
        callback(pick);
      }
    );

    const closePicker = action(() => {
      // Remove the map interaction mode
      terria.mapInteractionModeStack = terria.mapInteractionModeStack.filter(
        mode => mode !== pickMode
      );
      reactionDisposer();
    });

    return closePicker;
  }
);

function getHTMLElement(
  elementOrSelector: string | HTMLElement | undefined
): HTMLElement | undefined {
  if (elementOrSelector instanceof HTMLElement) {
    return elementOrSelector;
  } else if (typeof elementOrSelector === "string") {
    const element = document.querySelector(elementOrSelector);
    return element instanceof HTMLElement ? element : undefined;
  } else {
    return undefined;
  }
}

export default MousePickInteraction;
