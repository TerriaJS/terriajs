import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Icon from "../../../Icon.jsx";
import Styles from "./help-panel.scss";
import { action } from "mobx";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import styled from "styled-components";
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
    const CompassWrapper = styled(Box).attrs({
      centered: true
    })`
      flex-shrink: 0;
      width: 64px;
      height: 64px;
      margin-right: 10px;
      display: table-cell;
    `;
    const CompassIcon = styled(Icon)`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      ${props =>
        `
          fill: #575757;
          width: 30px;
          height: 30px;
        `}
      ${props =>
        props.darken &&
        `
          opacity: 0.2;
        `}
    `;
    const itemSelected =
      this.props.viewState.selectedHelpMenuItem === this.props.itemString;
    const className = classNames({
      [Styles.panelItem]: true,
      [Styles.isSelected]: itemSelected
    });
    return (
      <div>
        <button className={className} onClick={this.changeActiveItem}>
          <Box
            left
            css={`
              display: table-row;
              text-align: left;
            `}
          >
            <CompassWrapper>
              <CompassIcon glyph={this.props.iconElement} />
            </CompassWrapper>
            <Text
              semiBold
              uppercase
              css={`
                display: table-cell;
                vertical-align: middle;
                font-size: 16px;
                line-height: 17px;
              `}
            >
              {this.props.title}
            </Text>
          </Box>
        </button>
        {this.props.viewState.showHelpMenu &&
          this.props.viewState.helpPanelExpanded &&
          itemSelected && (
            <HelpVideoPanel
              terria={this.props.terria}
              viewState={this.props.viewState}
              title={this.props.title}
              itemString={this.props.itemString}
              description={this.props.description}
              videoLink={this.props.videoLink}
              background={this.props.background}
            />
          )}
      </div>
    );
  }
}

export default withTranslation()(HelpPanelItem);
