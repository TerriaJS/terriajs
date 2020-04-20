import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Icon from "../../../Icon.jsx";
import Styles from "./help-panel.scss";
import { action } from "mobx";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import MapIconButton from "../../../MapIconButton/MapIconButton";
import HelpPanelItem from "./HelpPanelItem";

@observer
class HelpPanel extends React.Component {
  static displayName = "HelpPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    items: PropTypes.array,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  @action.bound
  hidePanel() {
    this.props.viewState.showHelpMenu = false;
    this.props.viewState.helpPanelExpanded = false;
    this.props.viewState.selectedHelpMenuItem = "";
  }

  @action.bound
  handleClick() {
    this.props.viewState.topElement = "HelpPanel";
  }

  render() {
    // const { t } = this.props;
    const className = classNames(
      {
        [Styles.helpPanel]: true,
        [Styles.helpPanelShifted]: this.props.viewState.helpPanelExpanded
      },
      this.props.viewState.topElement === "HelpPanel" ? "top-element" : ""
    );
    return (
      <div className={className} onClick={this.handleClick}>
        <div
          css={`
            svg {
              width: 15px;
              height: 15px;
            }
            button {
              box-shadow: none;
              float: right;
            }
          `}
        >
          <MapIconButton
            onClick={this.hidePanel}
            iconElement={() => <Icon glyph={Icon.GLYPHS.closeLight} />}
          />
        </div>
        <Box
          centered
          css={`
            direction: ltr;
            min-width: 295px;
            padding: 90px 20px;
            padding-bottom: 0px;
            display: inline-block;
          `}
        >
          <Text heading>We&apos;re here to help</Text>
          <Spacing bottom={5} />
          <Text medium>
            Find useful tips on how to use the Digital Twin either by checking
            the video guides below or by contacting the team at{" "}
            <span className={Styles.link}>info@terria.io</span>.
          </Text>
          {/* <Spacing bottom={5} />
          <Box centered>
            <button
              className={Styles.tourBtn}
              title={"Take the tour"}
              // onClick={}
            >
              {" "}
              <Icon glyph={Icon.GLYPHS.tour} /> {"Take the tour"}{" "}
            </button>
          </Box> */}
        </Box>
        <Box
          centered
          css={`
            display: inline-block;
          `}
        >
          <Spacing bottom={10} />
          <Box
            css={`
              display: inline-block;
            `}
          >
            <HelpPanelItem
              terria={this.props.terria}
              viewState={this.props.viewState}
              iconElement={Icon.GLYPHS.start}
              title={"Getting started with a map"}
              itemString={"getstarted"}
              description={[
                "If you're new to the map or using spatial data, our Getting Started video quickly covers the basic functionality you'll need to use to add and interrogate data sets.",
                "If you don't have time to watch the video, we suggest exploring the following areas:",
                "• Search for a location to quickly find an area of interest",
                "• Use 'Explore map data' to view the catalogue of available data sets and add them to the map",
                "• Interact with the data layer, including opacity and toggling on and off on the left in your workbench",
                "• Click on the data on the map to view more detailed data, including the raw data",
                "• Change your basemap using options in 'Map Settings' to help make some data sets more visible",
                "• Zoom and change your view, including tilting the view angle using the controls on the right-hand side of the screen"
              ]}
              videoLink={"https://www.youtube.com/embed/NTtSM70rIvI"}
              background={
                "https://img.youtube.com/vi/NTtSM70rIvI/maxresdefault.jpg"
              }
            />
            {this.props.items}
          </Box>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpPanel);
