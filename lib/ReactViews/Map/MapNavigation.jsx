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

import classNames from "classnames";
import { observer } from "mobx-react";
import defined from "terriajs-cesium/Source/Core/defined";
// import HelpTool from "./Navigation/HelpTool";
// import StylesToolButton from "./Navigation/tool_button.scss";
import Icon from "../Icon";

// import Icon from "../Icon";
import Box from "../../Styled/Box";
import Text from "../../Styled/Text";
import MapIconButton from "../MapIconButton/MapIconButton";
import FeedbackButton from "../Feedback/FeedbackButton";
import CloseToolButton from "./Navigation/CloseToolButton";
import Prompt from "../Generic/Prompt";
import { runInAction } from "mobx";
import { withTranslation } from "react-i18next";

const StyledMapNavigation = styled.div`
  pointer-events: none;
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
    const isDiffMode = this.props.viewState.isToolOpen && toolIsDifference;

    return (
      <StyledMapNavigation
        className={classNames(Styles.mapNavigation, {
          [Styles.withTimeSeriesControls]: defined(
            this.props.terria.timelineStack.top
          )
        })}
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
                    />
                  </div>
                </If>
                <div className={Styles.control}>
                  <ZoomControl terria={this.props.terria} />
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
                  <MyLocation terria={this.props.terria} />
                </div>
              </If>
              <If
                condition={
                  !this.props.terria.configParameters.disableSplitter &&
                  !isDiffMode
                }
              >
                <div className={Styles.control}>
                  <ToggleSplitterTool
                    terria={this.props.terria}
                    viewState={this.props.viewState}
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
              <div className={Styles.control}>
                <FeedbackButton
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
              <If condition={!this.props.viewState.useSmallScreenInterface}>
                <div className={Styles.control}>
                  <MapIconButton
                    expandInPlace
                    iconElement={() => <Icon glyph={Icon.GLYPHS.helpThick} />}
                    onClick={() => this.props.viewState.showHelpPanel()}
                    neverCollapse={
                      this.props.viewState.featurePrompts.indexOf("help") >= 0
                    }
                  >
                    {t("helpPanel.help")}
                  </MapIconButton>
                </div>
                <Prompt
                  content={
                    <div>
                      <Text bold extraLarge textLight>
                        {t("helpPanel.promptMessage")}
                      </Text>
                    </div>
                  }
                  displayDelay={500}
                  dismissText={t("helpPanel.dismissText")}
                  dismissAction={() => {
                    runInAction(() =>
                      this.props.viewState.toggleFeaturePrompt(
                        "help",
                        false,
                        true
                      )
                    );
                  }}
                  caretTopOffset={75}
                  caretLeftOffset={265}
                  caretSize={15}
                  promptWidth={273}
                  promptTopOffset={-20}
                  promptLeftOffset={-330}
                  isVisible={
                    this.props.viewState.featurePrompts.indexOf("help") >= 0
                  }
                />
              </If>
            </div>
          </Box>
        </Box>
      </StyledMapNavigation>
    );
  }
}

export default withTranslation()(withTheme(MapNavigation));
