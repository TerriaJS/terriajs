import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import PickedFeatures from "../../Map/PickedFeatures";
import ViewState from "../../ReactViewModels/ViewState";
import AnimatedSpinnerIcon from "../../Styled/AnimatedSpinnerIcon";
import Button from "../../Styled/Button";
import { TextSpan } from "../../Styled/Text";
import CurrentLocation from "./CurrentLocation";
import MousePickInteraction from "./MousePickInteraction";

type PropsType = {
  viewState: ViewState;
  location?: Cartesian3;
  onPick: (pickedFeatures: PickedFeatures | undefined) => void;
};

type State = "init" | "picking" | "loading" | "picked";

const LocationPicker: React.FC<PropsType> = observer(props => {
  const { viewState, location, onPick } = props;
  const [t] = useTranslation();
  const [state, setState] = useState<State>("init");

  const setPicked = (picked: PickedFeatures | undefined) => {
    setState("picked");
    props.onPick(picked);
  };

  useEffect(() => {
    if (state === "picked" && location === undefined) {
      setState("init");
    }
  });

  return (
    <Container>
      {state === "init" && (
        <FilterButton onClick={() => setState("picking")}>
          {t("compare.dateLocationFilter.filter")}
        </FilterButton>
      )}
      {state === "picking" && (
        <CancelButton onClick={() => setState("init")}>
          {t("compare.dateLocationFilter.cancel")}
        </CancelButton>
      )}
      {state === "loading" && (
        <CancelButton onClick={() => setState("init")}>
          <AnimatedSpinnerIcon
            light
            styledWidth="14px"
            css={`
              display: inline;
              margin-right: 1em;
            `}
          />
          {t("compare.dateLocationFilter.loading")}
          <CancelText>{t("compare.dateLocationFilter.cancel")}</CancelText>
        </CancelButton>
      )}
      {(state === "picking" || state === "loading") && (
        <MousePickInteraction
          terria={viewState.terria}
          onLoadingPick={() => setState("loading")}
          onCancelPick={() => setState("init")}
          onFinishPick={setPicked}
        />
      )}
      {state === "picked" && location && (
        <CurrentLocation
          location={location}
          onClear={() => onPick(undefined)}
        />
      )}
    </Container>
  );
});

const Container = styled.div`
  position: absolute;
  top: -50px;
`;

const FilterButton = styled(Button).attrs({
  shortMinHeight: true,
  primary: true
})`
  &:hover,
  &:focus {
    opacity: 1;
  }
`;

const CancelButton = styled(Button).attrs({
  shortMinHeight: true,
  primary: true
})`
  &:hover,
  &:focus {
    opacity: 1;
  }

  & ${TextSpan} {
    display: flex;
  }
`;

const CancelText = styled.span`
  margin-left: 1em;
  text-decoration: underline;
`;

export default LocationPicker;
