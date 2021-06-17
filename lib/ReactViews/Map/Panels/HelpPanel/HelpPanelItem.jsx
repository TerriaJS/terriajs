import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import Styles from "./help-panel.scss";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import styled, { withTheme } from "styled-components";
import HelpVideoPanel from "./HelpVideoPanel";

@observer
class HelpPanelItem extends React.Component {
  static displayName = "HelpPanelItem";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;
    const { icon } = this.props.content;
    const MenuIconWrapper = styled(Box).attrs({
      centered: true
    })`
      flex-shrink: 0;
      width: 64px;
      height: 64px;
      display: table-cell;
      vertical-align: middle;
      padding-left: 25px;
    `;
    const itemSelected =
      this.props.viewState.selectedHelpMenuItem === this.props.content.itemName;
    const className = classNames({
      [Styles.panelItem]: true,
      [Styles.isSelected]: itemSelected
    });

    // `content.icon` is user defined and can possibly force the UI to lookup a
    // nonexistant icon.
    const iconGlyph = Icon.GLYPHS[icon] || Icon.GLYPHS.video;
    const title = t(this.props.content.title) || "";
    return (
      <div
        css={`
          height: 70px;
        `}
      >
        <button
          className={className}
          onClick={() => {
            this.props.terria.analytics?.logEvent(
              "Help",
              "Item selected",
              title
            );
            this.props.viewState.selectHelpMenuItem(
              this.props.content.itemName
            );
          }}
        >
          <Box
            left
            fullHeight
            css={`
              display: table-row;
              text-align: left;
            `}
          >
            <MenuIconWrapper>
              {/* TODO: Enable overriding non-terriajs icons */}
              <StyledIcon
                styledWidth={"27px"}
                fillColor={this.props.theme.textDark}
                glyph={iconGlyph}
              />
            </MenuIconWrapper>
            <Text
              semiBold
              extraLarge
              uppercase
              textDark
              css={`
                padding-right: 25px;
                padding-left: 5px;
                display: table-cell;
                vertical-align: middle;
                line-height: 17px;
              `}
            >
              {title}
            </Text>
          </Box>
        </button>
        <HelpVideoPanel
          terria={this.props.terria}
          viewState={this.props.viewState}
          content={this.props.content}
          itemString={this.props.content.itemName}
          paneMode={this.props.content.paneMode}
          markdownContent={this.props.content.markdownText}
          videoUrl={
            this.props.content.videoUrl
              ? t(this.props.content.videoUrl)
              : this.props.content.videoUrl
          }
          placeholderImage={
            this.props.content.placeholderImage
              ? t(this.props.content.placeholderImage)
              : this.props.content.placeholderImage
          }
        />
      </div>
    );
  }
}

export default withTranslation()(withTheme(HelpPanelItem));
