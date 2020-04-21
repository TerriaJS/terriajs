import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Icon, { StyledIcon } from "../../../Icon.jsx";
import Styles from "./help-panel.scss";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import HelpPanelItem from "./HelpPanelItem";
import { RawButton } from "../../../../Styled/Button.jsx";
import styled from "styled-components";

const Numbers = styled(Text)`
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  ${props => props.darkBg && `background-color: ${props.theme.textDark};`}
`;

@observer
class HelpPanel extends React.Component {
  static displayName = "HelpPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    items: PropTypes.array,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  renderOrderedList(contents) {
    console.log(this.props.theme);
    return (
      <For each="content" index="i" of={contents}>
        <Box paddedVertically>
          <Box centered paddedHorizontally={4}>
            <Numbers small textLight textAlignCenter darkBg>
              {i + 1}
            </Numbers>
          </Box>
          <Text medium textDark>
            {content}
          </Text>
        </Box>
      </For>
    );
  }

  render() {
    // const { t } = this.props;
    const isVisible =
      this.props.viewState.showHelpMenu &&
      this.props.viewState.topElement === "HelpPanel";
    const isExpanded = this.props.viewState.helpPanelExpanded;
    const className = classNames(
      {
        [Styles.helpPanel]: true,
        [Styles.isVisible]: isVisible && !isExpanded,
        [Styles.isHidden]: !isVisible,
        [Styles.helpPanelShifted]: isVisible && isExpanded
      },
      this.props.viewState.topElement === "HelpPanel" ? "top-element" : ""
    );
    return (
      <div
        className={className}
        onClick={() => this.props.viewState.setTopElement("HelpPanel")}
      >
        <div
          css={`
            button {
              padding: 15px;
              position: absolute;
              right: 0;
              z-index: 110;
            }
          `}
        >
          <RawButton onClick={() => this.props.viewState.hideHelpPanel()}>
            <StyledIcon
              styledWidth={"16px"}
              fillColor={this.props.theme.textDark}
              opacity={"0.5"}
              glyph={Icon.GLYPHS.closeLight}
            />
          </RawButton>
        </div>
        <Box
          centered
          paddedHorizontally={5}
          paddedVertically={17}
          displayInlineBlock
          css={`
            direction: ltr;
            min-width: 295px;
            padding-bottom: 0px;
          `}
        >
          <Text extraBold heading textDark>
            We&apos;re here to help
          </Text>
          <Spacing bottom={4} />
          <Text medium textDark>
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
        <Spacing bottom={10} />
        <Box centered displayInlineBlock>
          <Box displayInlineBlock>
            <HelpPanelItem
              terria={this.props.terria}
              viewState={this.props.viewState}
              iconElement={Icon.GLYPHS.start}
              title={"Getting started with a map"}
              itemString={"getstarted"}
              description={[
                "If you're new to the map or using spatial data, our Getting Started video quickly covers the basic functionality you'll need to use to add and interrogate data sets.",
                "If you don't have time to watch the video, we suggest exploring the following areas:",
                this.renderOrderedList([
                  "Search for a location to quickly find an area of interest",
                  "Use 'Explore map data' to view the catalogue of available data sets and add them to the map",
                  "Interact with the data layer, including opacity and toggling on and off on the left in your workbench",
                  "Click on the data on the map to view more detailed data, including the raw data",
                  "Change your basemap using options in 'Map Settings' to help make some data sets more visible",
                  "Zoom and change your view, including tilting the view angle using the controls on the right-hand side of the screen"
                ])
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

export default withTranslation()(withTheme(HelpPanel));
