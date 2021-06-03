import { action, reaction } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import PickedFeatures from "../../Map/PickedFeatures";
import MapInteractionMode, { UIMode } from "../../Models/MapInteractionMode";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";
import CurrentLocation from "./CurrentLocation";

type PropsType = {
  viewState: ViewState;
  location?: Cartesian3;
  onPick: (pickedFeatures: PickedFeatures | undefined) => void;
};

const LocationPicker: React.FC<PropsType> = observer(props => {
  const { viewState, location, onPick } = props;
  const [t] = useTranslation();
  const [isPicking, setIsPicking] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  // Keeps track of current pick
  const currentPick = useRef<PickedFeatures | undefined>(undefined);
  const mapContainer = getHTMLElement(viewState.terria.mainViewer.mapContainer);

  const cancelPicking = () => {
    setIsPicking(false);
    setShowTooltip(false);
    currentPick.current = undefined;
  };

  const toggleIsPicking = () => {
    if (isPicking) {
      cancelPicking();
    } else {
      setIsPicking(true);
      setShowTooltip(true);
    }
  };

  useEffect(() => {
    if (isPicking) {
      const disposer = startPickInteractionMode(
        viewState.terria,
        async pickedFeatures => {
          currentPick.current = pickedFeatures;
          setShowTooltip(false);
          await pickedFeatures?.allFeaturesAvailablePromise;
          setIsPicking(false);
          // After awaiting, ignore this pick if a new currentPick was set
          if (currentPick.current === pickedFeatures) {
            onPick(pickedFeatures);
            currentPick.current = undefined;
          }
        }
      );
      return disposer;
    }
  }, [isPicking]);

  return (
    <Container>
      {location === undefined && (
        <FilterButton primary onClick={toggleIsPicking}>
          {isPicking
            ? t("compare.dateLocationFilter.cancel")
            : t("compare.dateLocationFilter.filter")}
        </FilterButton>
      )}
      {location && !isPicking && (
        <CurrentLocation
          location={location}
          onClear={() => onPick(undefined)}
        />
      )}
      {showTooltip && mapContainer && (
        <MouseTooltip mapContainer={mapContainer} onCancel={cancelPicking} />
      )}
    </Container>
  );
});

type MouseTooltipProps = {
  mapContainer: HTMLElement;
  onCancel: () => void;
};

const MouseTooltip: React.FC<MouseTooltipProps> = ({
  mapContainer,
  onCancel
}) => {
  const [t] = useTranslation();
  const [mousePosition, setMousePosition] = useState<
    { x: number; y: number } | undefined
  >();

  useEffect(function onMount() {
    const listener = (ev: MouseEvent) =>
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    mapContainer.addEventListener("mousemove", listener);
    mapContainer.addEventListener("contextmenu", onCancel);
    mapContainer.style.cursor = "crosshair";
    return function onUnmount() {
      mapContainer.removeEventListener("mousemove", listener);
      mapContainer.removeEventListener("contextmenu", onCancel);
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

const startPickInteractionMode = action(
  (terria: Terria, callback: (pick: PickedFeatures | undefined) => void) => {
    // Add a new map interaction mode
    const pickMode = new MapInteractionMode({
      message: "foo",
      messageAsNode: <div></div>,
      uiMode: UIMode.Difference
    });
    terria.mapInteractionModeStack.push(pickMode);

    // Setup a reaction to watch picking
    const reactionDisposer = reaction(
      () => pickMode.pickedFeatures,
      (pick: PickedFeatures | undefined) => {
        closePicker();
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

const Container = styled.div`
  position: absolute;
  top: -50px;
`;

const FilterButton = styled(Button).attrs({ shortMinHeight: true })``;

export default LocationPicker;
