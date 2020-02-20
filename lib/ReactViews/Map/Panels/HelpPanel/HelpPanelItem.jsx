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
class HelpPanelItem extends React.Component {

  static displayName = "HelpPanelItem";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    iconElement: PropTypes.element.isRequired,
    label: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;
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
    return (
      <Box css={`
        display: table-row;
      `}>
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
        `}>
          {this.props.label}
        </Text>
      </Box>
    );
  }
}

export default withTranslation()(HelpPanelItem);
