import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import {
  Category,
  HelpAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import { isJsonString } from "../../../../Core/Json";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import Text from "../../../../Styled/Text";
import { applyTranslationIfExists } from "../../../../Language/languageHelpers";
import HelpVideoPanel from "./HelpVideoPanel";

@observer
class HelpPanelItem extends React.Component {
  static displayName = "HelpPanelItem";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired
  };

  render() {
    // @ts-expect-error TS(2339): Property 'i18n' does not exist on type 'Readonly<{... Remove this comment to see the full error message
    const { i18n } = this.props;

    const itemSelected =
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.selectedHelpMenuItem === this.props.content.itemName;

    // `content.icon` is user defined and can possibly force the UI to lookup a
    // nonexistant icon.
    // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
    const title = isJsonString(this.props.content.title)
      ? // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
        applyTranslationIfExists(this.props.content.title, i18n)
      : "";
    // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
    const paneMode = this.props.content.paneMode;
    const opensInPanel = paneMode !== "externalLink";
    const iconGlyph = opensInPanel
      ? Icon.GLYPHS.right
      : Icon.GLYPHS.externalLink;
    return (
      <div>
        <MenuButton
          // @ts-expect-error TS(2769): No overload matches this call.
          isSelected={itemSelected}
          role={paneMode === "externalLink" ? "link" : undefined}
          onClick={() => {
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            this.props.terria.analytics?.logEvent(
              Category.help,
              // @ts-expect-error TS(2339): Property 'itemSelected' does not exist on type 'ty... Remove this comment to see the full error message
              HelpAction.itemSelected,
              title
            );
            if (opensInPanel) {
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              this.props.viewState.selectHelpMenuItem(
                // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
                this.props.content.itemName
              );
              // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
            } else if (paneMode === "externalLink" && this.props.content.url) {
              // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
              window.open(this.props.content.url);
            }
          }}
        >
          <MenuItemText>{title}</MenuItemText>
          <StyledIcon
            styledWidth={"12px"}
            // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
            fillColor={this.props.theme.textLightDimmed}
            glyph={iconGlyph}
          />
        </MenuButton>
        {opensInPanel && (
          <HelpVideoPanel
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            terria={this.props.terria}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
            // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
            content={this.props.content}
            // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
            itemString={this.props.content.itemName}
            // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
            paneMode={this.props.content.paneMode}
            // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
            markdownContent={this.props.content.markdownText}
            videoUrl={
              // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
              isJsonString(this.props.content.videoUrl)
                ? // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
                  applyTranslationIfExists(this.props.content.videoUrl, i18n)
                : undefined
            }
            placeholderImage={
              // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
              isJsonString(this.props.content.placeholderImage)
                ? applyTranslationIfExists(
                    // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
                    this.props.content.placeholderImage,
                    i18n
                  )
                : undefined
            }
            // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
            videoCoverImageOpacity={this.props.content.videoCoverImageOpacity}
          />
        )}
      </div>
    );
  }
}

const MenuButton = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 16px 0;
  border: 0;
  border-bottom: 1px solid #ddd;
  background: transparent;

  &:hover {
    color: ${(p) => p.theme.textBlack};
    & ${StyledIcon} {
      fill: ${(p) => p.theme.textBlack};
    }
  }

  // @ts-expect-error TS(2339): Property 'isSelected' does not exist on type 'Them... Remove this comment to see the full error message
  color: ${(p) => (p.isSelected ? p.theme.textBlack : p.theme.textDark)};
  & ${StyledIcon} {
    // @ts-expect-error TS(2339): Property 'isSelected' does not exist on type 'Them... Remove this comment to see the full error message
    fill: ${(p) => (p.isSelected ? p.theme.textBlack : p.theme.textDark)};
  }
`;

const MenuItemText = styled(Text).attrs({
  semiBold: true,
  large: true
})`
  padding-right: 25px;
  padding-left: 5px;
  text-align: left;
`;

export default withTranslation()(withTheme(HelpPanelItem));
