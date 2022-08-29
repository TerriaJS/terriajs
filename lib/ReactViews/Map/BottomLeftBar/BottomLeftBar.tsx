import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import ViewState from "../../../ReactViewModels/ViewState";
import Icon from "../../../Styled/Icon";

import styled, { useTheme } from "styled-components";
import Box from "../../../Styled/Box";
import MapDataCount from "../../BottomDock/MapDataCount";
import Terria from "../../../Models/Terria";
import MapIconButton from "../../MapIconButton/MapIconButton";
import defined from "terriajs-cesium/Source/Core/defined";
import { useViewState } from "../../Context";

const BottomLeftContainer = styled(Box)`
  position: absolute;
  bottom: 40px;
  @media (max-width: ${(props) => props.theme.mobile}px) {
    bottom: 35px;
  }
`;
const shouldShowPlayStoryButton = (viewState: ViewState) =>
  viewState.terria.configParameters.storyEnabled &&
  defined(viewState.terria.stories) &&
  viewState.terria.stories.length > 0 &&
  viewState.useSmallScreenInterface;

const BottomLeftBar: FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const viewState = useViewState();

  const isNotificationActive =
    viewState.terria.notificationState.currentNotification;

  return (
    <BottomLeftContainer theme={theme}>
      <MapDataCount
        terria={viewState.terria}
        viewState={viewState}
        elementConfig={viewState.terria.elements.get("map-data-count")}
      />
      {shouldShowPlayStoryButton(viewState) ? (
        <Box paddedHorizontally={2}>
          <MapIconButton
            title={t("story.playStory")}
            neverCollapse={true}
            iconElement={() => <Icon glyph={Icon.GLYPHS.playStory} />}
            onClick={() => viewState.runStories()}
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
