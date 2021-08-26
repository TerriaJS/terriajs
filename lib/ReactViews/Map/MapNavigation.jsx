import Compass from "./Navigation/Compass";
import MyLocation from "./Navigation/MyLocation";
import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";
import { withTheme } from "styled-components";
import { Medium } from "../Generic/Responsive";
import Styles from "./map-navigation.scss";
import ToggleSplitterTool from "./Navigation/ToggleSplitterTool";
import ViewerMode from "../../Models/ViewerMode";
import ZoomControl from "./Navigation/ZoomControl";

import withControlledVisibility from "../../ReactViews/HOCs/withControlledVisibility";

import classNames from "classnames";
import { observer } from "mobx-react";
// import HelpTool from "./Navigation/HelpTool";
// import StylesToolButton from "./Navigation/tool_button.scss";
import Icon from "../../Styled/Icon";
import { ToolButton } from "../Tool.tsx";
import PedestrianMode from "../Tools/PedestrianMode/PedestrianMode";

// import Icon from "../Icon";
import Box from "../../Styled/Box";
import FeedbackButton from "../Feedback/FeedbackButton";
import CloseToolButton from "./Navigation/CloseToolButton";

import { withTranslation } from "react-i18next";
import Cesium from "../../Models/Cesium";

/**
 * TODO: fix this so that we don't need to override pointer events like this.
 * a fix would look like breaking up the top and bottom parts, so there is
 * no element "drawn/painted" between the top and bottom parts of map
 * navigation
 */
const StyledMapNavigation = styled.div`
  pointer-events: none;
  button {
    pointer-events: auto;
  }
  ${p =>
    p.trainerBarVisible &&
    `
    top: ${Number(p.theme.trainerHeight) + Number(p.theme.mapNavigationTop)}px;
  `}
`;


// The map navigation region
@observer
class MapNavigation extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
    navItems: PropTypes.arrayOf(PropTypes.element)
  };

  static defaultProps = {
    navItems: []
  };

  render() {
    const { viewState, t } = this.props;
    const toolIsDifference =
      this.props.viewState.currentTool?.toolName === "Difference";

    return (
      <StyledMapNavigation
        className={classNames(Styles.mapNavigation)}
        trainerBarVisible={viewState.trainerBarVisible}
      >
        <Box centered column justifySpaceBetween fullHeight alignItemsFlexEnd>
          <Box column>
            <Medium>
              <div className={Styles.navs}>
                <If
                  condition={
                    this.props.terria.mainViewer.viewerMode ===
                    ViewerMode.Cesium
                  }
                >
                  <div className={Styles.control}>
                    <Compass
                      terria={this.props.terria}
                      viewState={this.props.viewState}
                      elementConfig={this.props.terria.elements.get("compass")}
                    />
                  </div>
                </If>
                <div className={Styles.control}>
                  <ZoomControl
                    terria={this.props.terria}
                    elementConfig={this.props.terria.elements.get("zoom")}
                  />
                </div>
              </div>
            </Medium>
            <div className={Styles.controls}>
              <If
                condition={
                  !this.props.terria.configParameters.disableMyLocation
                }
              >
                <div className={Styles.control}>
                  <MyLocation
                    terria={this.props.terria}
                    elementConfig={this.props.terria.elements.get(
                      "my-location"
                    )}
                  />
                </div>
              </If>
              <If
                condition={!this.props.terria.configParameters.disableSplitter}
              >
                <div className={Styles.control}>
                  <ToggleSplitterTool
                    terria={this.props.terria}
                    viewState={this.props.viewState}
                    elementConfig={this.props.terria.elements.get("split-tool")}
                  />
                </div>
              </If>
              <If
                condition={
                  !this.props.terria.configParameters.disablePedestrianMode &&
                  !this.props.viewState.useSmallScreenInterface &&
                  this.props.terria.currentViewer instanceof Cesium
                }
              >
                <div className={Styles.control}>
                  <ToolButton
                    viewState={this.props.viewState}
                    toolName={t("pedestrianMode.toolButtonTitle")}
                    icon={Icon.GLYPHS.pedestrian}
                    getToolComponent={() => Promise.resolve(PedestrianMode)}
                    params={{ cesium: this.props.terria.currentViewer }}
                    t={t}
                  />
                </div>
              </If>
              <If condition={this.props.viewState.currentTool?.showCloseButton}>
                <CloseToolButton
                  toolIsDifference={toolIsDifference}
                  viewState={this.props.viewState}
                />
              </If>
              <For each="item" of={this.props.navItems} index="i">
                <div className={Styles.control} key={i}>
                  {item}
                </div>
              </For>
            </div>
          </Box>
          <Box
            column
            // bottom map buttons
          >
            <div className={Styles.controls}>
              {this.props.terria.configParameters.feedbackUrl &&
                !this.props.viewState.hideMapUi && (
                  <div className={Styles.control}>
                    <FeedbackButton
                      terria={this.props.terria}
                      viewState={this.props.viewState}
                      elementConfig={this.props.terria.elements.get("feedback")}
                    />
                  </div>
                )}
            </div>
          </Box>
        </Box>
      </StyledMapNavigation>
    );
  }
}

export default withTranslation()(
  withTheme(withControlledVisibility(MapNavigation))
);
