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

@observer
class HelpPanel extends React.Component {
  static displayName = "HelpPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    items: PropTypes.object,
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
              title={"Getting started with the Digital Twin"}
              itemString={"getstarted"}
              description={[
                "If you’re new to the NSW Spatial Digital Twin, this video provides a short explanation of how to use some of the basic functions, so you can feel like a pro in no time!",
                "We cover:",
                <span key={2}>
                  • Signing in to the{" "}
                  <a href="https://portal.spatial.nsw.gov.au/portal/apps/sites/#/home">
                    NSW Spatial Collaboration Portal
                  </a>
                </span>,
                "• Finding a location",
                "• Exploring public data in the catalogue and adding it to the Digital Twin",
                "• Workbench controls",
                "• Removing data"
              ]}
              videoLink={"https://www.youtube.com/embed/lQE5E1O7VTs"}
              background={
                "https://img.youtube.com/vi/lQE5E1O7VTs/maxresdefault.jpg"
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
