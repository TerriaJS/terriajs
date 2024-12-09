import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import {
  Category,
  HelpAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import Box from "../../../../Styled/Box";
import Button, { RawButton } from "../../../../Styled/Button";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import parseCustomMarkdownToReact from "../../../Custom/parseCustomMarkdownToReact";
import { withViewState } from "../../../Context";
import HelpPanelItem from "./HelpPanelItem";

export const HELP_PANEL_ID = "help";

@observer
class HelpPanel extends React.Component {
  static displayName = "HelpPanel";

  static propTypes = {
    viewState: PropTypes.object.isRequired,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props: any) {
    super(props);
    this.state = {
      isAnimatingOpen: true
    };
  }

  componentDidMount() {
    // The animation timing is controlled in the CSS so the timeout can be 0 here.
    setTimeout(() => this.setState({ isAnimatingOpen: false }), 0);
  }

  componentWillUnmount() {
    // Make sure that retainSharePanel is set to false. This property is used to temporarily disable closing when Share Panel loses focus.
    // If the Share Panel is open underneath help panel, we now want to allow it to close normally.
    setTimeout(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.setRetainSharePanel(false);
    }, 500); // We need to re-enable closing of share panel when loses focus.
  }

  render() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const helpItems = this.props.viewState.terria.configParameters.helpContent;
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const isExpanded = this.props.viewState.helpPanelExpanded;
    // @ts-expect-error TS(2339): Property 'isAnimatingOpen' does not exist on type ... Remove this comment to see the full error message
    const isAnimatingOpen = this.state.isAnimatingOpen;
    return (
      <Box
        displayInlineBlock
        // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
        backgroundColor={this.props.theme.textLight}
        styledWidth={"320px"}
        fullHeight
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        onClick={() => this.props.viewState.setTopElement("HelpPanel")}
        css={`
          position: fixed;
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          z-index: ${this.props.viewState.topElement === "HelpPanel"
            ? 99999
            : 110};
          transition: right 0.25s;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          right: ${isAnimatingOpen ? -320 : isExpanded ? 490 : 0}px;
        `}
      >
        <Box position="absolute" paddedRatio={3} topRight>
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on
          type 'Reado... Remove this comment to see the full error message
          <RawButton onClick={() => this.props.viewState.hideHelpPanel()}>
            <StyledIcon
              styledWidth={"16px"}
              // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
              fillColor={this.props.theme.textDark}
              opacity={0.5}
              glyph={Icon.GLYPHS.closeLight}
            />
          </RawButton>
        </Box>
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
            {parseCustomMarkdownToReact(
              t("helpPanel.menuPaneBody", {
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                supportEmail: this.props.viewState.terria.supportEmail
              })
            )}
          </Text>
          <Spacing bottom={5} />
          <Box centered>
            <Button
              primary
              rounded
              styledMinWidth={"240px"}
              onClick={() => {
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                this.props.viewState.terria.analytics?.logEvent(
                  Category.help,
                  HelpAction.takeTour
                );
                runInAction(() => {
                  // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                  this.props.viewState.hideHelpPanel();
                  // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                  this.props.viewState.setTourIndex(0);
                });
              }}
              renderIcon={() => (
                <StyledIcon
                  light
                  styledWidth={"18px"}
                  glyph={Icon.GLYPHS.tour}
                />
              )}
              textProps={{
                large: true
              }}
              css={`
                ${(p: any) => p.theme.addTerriaPrimaryBtnStyles(p)}
              `}
            >
              {t("helpPanel.takeTour")}
            </Button>
          </Box>
        </Box>
        <Spacing bottom={10} />
        <Box centered displayInlineBlock fullWidth styledPadding="0 26px">
          {helpItems &&
            helpItems.map((item: any, i: any) => (
              <HelpPanelItem
                key={i}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                terria={this.props.viewState.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
                content={item}
              />
            ))}
        </Box>
      </Box>
    );
  }
}

// @ts-expect-error TS(2345): Argument of type 'ForwardRefExoticComponent<WithOp... Remove this comment to see the full error message
export default withTranslation()(withViewState(withTheme(HelpPanel)));
