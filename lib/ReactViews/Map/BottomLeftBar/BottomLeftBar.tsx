import React from "react";
import { useTranslation } from "react-i18next";

import ViewState from "../../../ReactViewModels/ViewState";
import Icon from "../../../Styled/Icon";

import styled, { useTheme } from "styled-components";
import Box from "../../../Styled/Box";
import MapDataCount from "../../BottomDock/MapDataCount";
import Terria from "../../../Models/Terria";
import MapIconButton from "../../MapIconButton/MapIconButton";
import defined from "terriajs-cesium/Source/Core/defined";

interface Props {
  terria: Terria;
  viewState: ViewState;
}

const BottomLeftContainer = styled(Box)`
  position: absolute;
  bottom: 40px;

  @media (max-width: ${(props) => props.theme.mobile}px) {
    bottom: 35px;
  }
`;
const shouldShowPlayStoryButton = (props: Props) =>
  props.terria.configParameters.storyEnabled &&
  defined(props.terria.stories) &&
  props.terria.stories.length > 0 &&
  props.viewState.useSmallScreenInterface;

const BottomLeftBar = (props: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const isNotificationActive =
    props.terria.notificationState.currentNotification;

  return (
    <BottomLeftContainer theme={theme}>
      <MapDataCount
        terria={props.terria}
        viewState={props.viewState}
        elementConfig={props.terria.elements.get("map-data-count")}
      />
      {shouldShowPlayStoryButton(props) ? (
        <Box paddedHorizontally={2}>
          <MapIconButton
            title={t("story.playStory")}
            neverCollapse={true}
            iconElement={() => <Icon glyph={Icon.GLYPHS.playStory} />}
            onClick={() => props.viewState.runStories()}
            primary={!isNotificationActive}
          >
            {t("story.playStory")}
          </MapIconButton>
        </Box>
      ) : null}
    </BottomLeftContainer>
  );
};

export default BottomLeftBar;
