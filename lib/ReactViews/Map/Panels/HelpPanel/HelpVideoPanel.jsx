import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import Sortable from "react-anything-sortable";
import { withTranslation, Trans, useTranslation } from "react-i18next";
import combine from "terriajs-cesium/Source/Core/combine";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defined from "terriajs-cesium/Source/Core/defined";
import triggerResize from "../../Core/triggerResize";
import BadgeBar from "../BadgeBar.jsx";
import Icon from "../../../Icon.jsx";
import Loader from "../Loader";
import { getShareData } from "../Map/Panels/SharePanel/BuildShareLink";
import Styles from "./help-panel.scss";
import Story from "./Story.jsx";
import StoryEditor from "./StoryEditor.jsx";
import { runInAction, action } from "mobx";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import MapIconButton from "../../../MapIconButton/MapIconButton"
import styled from "styled-components";

@observer
class HelpVideoPanel extends React.Component {

  static displayName = "HelpVideoPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
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
    const { t } = this.props;
    return (
      <div className={Styles.videoPanel}>
        {/* <div
          css={`
            svg {
              width: 15px;
              height: 15px;
            }
            button {
              box-shadow: none;
              float: right
            }
          `}
        >
          <MapIconButton
            onClick={this.hidePanel}
            iconElement={() => <Icon glyph={Icon.GLYPHS.closeLight} />}
          />
        </div> */}
        <Box
          centered
          css={`
            direction: ltr;
            min-width: 295px;
            padding: 100px 20px;
            display: inline-block;
          `}
        >
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpVideoPanel);
