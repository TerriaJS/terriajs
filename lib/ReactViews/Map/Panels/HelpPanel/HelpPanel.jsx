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
    items: PropTypes.object.isRequired,
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
            {this.props.items}
          </Box>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpPanel);
