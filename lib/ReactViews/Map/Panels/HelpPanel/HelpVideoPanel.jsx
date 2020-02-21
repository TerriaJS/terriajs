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
import Loader from "../../../Loader";
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
    title: PropTypes.string.isRequired,
    itemString: PropTypes.string,
    description: PropTypes.array,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;
    const itemSelected = 
      this.props.viewState.selectedHelpMenuItem === 
      this.props.itemString;
    const className = classNames({
      [Styles.videoPanel]: true,
      [Styles.isSelected]: itemSelected
    })
    return (
      <div className={className}>
        <Box
          centered
          css={`
            width: 100%;
            height: 100%;
            padding: 50px 20px;
            display: inline-block;
          `}
        >
          <div
            className={Styles.videoGuideWrapper}
          >
            <div
              className={Styles.videoGuide}
              onClick={e => e.stopPropagation()}
              style={{
                backgroundImage: `url(${require("../../../../../wwwroot/images/data-stories-getting-started.jpg")})`
              }}
            >
              <div className={Styles.videoGuideRatio}>
                <div className={Styles.videoGuideLoading}>
                  <Loader message={` `} />
                </div>
                <iframe
                  className={Styles.videoGuideIframe}
                  src="https://www.youtube.com/embed/fbiQawV8IYY"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          </div>
          <Spacing bottom={3} />
          <Text
            bold
            title
          >
            {this.props.title}
          </Text>
          <For each="desc" of={this.props.description}>
            <Spacing bottom={3} />
            <Text medium>
              {desc}
            </Text>
          </For>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpVideoPanel);
