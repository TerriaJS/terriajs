import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import Sortable from "react-anything-sortable";
import { withTranslation, Trans } from "react-i18next";
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

@observer
class HelpPanel extends React.Component {

  static displayName = "HelpPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    isVisible: PropTypes.bool,
    viewState: PropTypes.object.isRequired,
    animationDuration: PropTypes.number,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  @action.bound
  hidePanel() {
    this.props.viewState.showHelpMenu = !this.props.viewState
    .showHelpMenu;
    console.log("Bye!");
  }

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.helpPanel}>
        <button 
          type="button"
          className={Styles.closeBtn}
          title={"Close panel"}
          onClick={this.hidePanel}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
        <Box center>
          <Box>
            <Text>
              <p>{`You aren't logged in as an administrator!
              None of your edits will save unless you log in.`}</p>
            </Text>
          </Box>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpPanel);
