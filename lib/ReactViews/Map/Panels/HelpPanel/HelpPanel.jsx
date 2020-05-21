import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { runInAction } from "mobx";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Icon, { StyledIcon } from "../../../Icon.jsx";
import Styles from "./help-panel.scss";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import parseCustomMarkdownToReact from "../../../Custom/parseCustomMarkdownToReact";
import HelpPanelItem from "./HelpPanelItem";
import { RawButton } from "../../../../Styled/Button.jsx";

@observer
class HelpPanel extends React.Component {
  static displayName = "HelpPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;
    // const isVisible = this.props.viewState.showHelpMenu;
    const helpItems = this.props.terria.configParameters.helpContent;
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
            {t("helpPanel.menuPaneTitle")}
          </Text>
          <Spacing bottom={4} />
          <Text medium textDark highlightLinks>
            {parseCustomMarkdownToReact(t("helpPanel.menuPaneBody"))}
          </Text>
          <Spacing bottom={5} />
          <Box centered>
            <button
              className={Styles.tourBtn}
              title={"Take the tour"}
              onClick={() => {
                runInAction(() => {
                  this.props.viewState.hideHelpPanel();
                  this.props.viewState.setTourIndex(0);
                });
              }}
            >
              {" "}
              <Icon glyph={Icon.GLYPHS.tour} /> {"Take the tour"}{" "}
            </button>
          </Box>
        </Box>
        <Spacing bottom={10} />
        <Box centered displayInlineBlock>
          <Box displayInlineBlock>
            {helpItems && (
              <For each="item" index="i" of={helpItems}>
                <HelpPanelItem
                  key={i}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                  content={item}
                />
              </For>
            )}
          </Box>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(withTheme(HelpPanel));
