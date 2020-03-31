import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { StyledIcon } from "../../../Icon.jsx";
import Styles from "./help-panel.scss";
import { action } from "mobx";
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
    iconElement: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    itemString: PropTypes.string,
    description: PropTypes.array,
    videoLink: PropTypes.string,
    background: PropTypes.string,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  static defaultProps = {
    videoLink: "https://www.youtube.com/watch?v=fbiQawV8IYY"
  };

  constructor(props) {
    super(props);
  }

  @action.bound
  changeActiveItem() {
    this.props.viewState.selectedHelpMenuItem = this.props.itemString;
    this.props.viewState.helpPanelExpanded = true;
  }

  render() {
    // const { t } = this.props;
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
    const MenuIcon = styled(StyledIcon)`
      position: relative;
      trasform: translate(0%, 0%);
    `;
    const itemSelected =
      this.props.viewState.selectedHelpMenuItem === this.props.itemString;
    const className = classNames({
      [Styles.panelItem]: true,
      [Styles.isSelected]: itemSelected
    });
    return (
      <div
        css={`
          height: 70px;
        `}
      >
        <button className={className} onClick={this.changeActiveItem}>
          <Box
            left
            fullHeight
            css={`
              display: table-row;
              text-align: left;
            `}
          >
            <MenuIconWrapper>
              <MenuIcon
                styledWidth={"27px"}
                fillColor={this.props.theme.textDark}
                glyph={this.props.iconElement}
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
              {this.props.title}
            </Text>
          </Box>
        </button>
        <HelpVideoPanel
          terria={this.props.terria}
          viewState={this.props.viewState}
          title={this.props.title}
          itemString={this.props.itemString}
          description={this.props.description}
          videoLink={this.props.videoLink}
          background={this.props.background}
        />
      </div>
    );
  }
}

export default withTranslation()(withTheme(HelpPanelItem));
