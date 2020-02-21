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
import HelpPanelItem from "./HelpPanelItem";

// export default function HelpPanel(props) {
//   const [helpPanelOpen, setHelpPanelOpen] = useState(false);
//   const { t } = useTranslation();
//   return (
//     <div className={Styles.helpPanel}>
//       <button 
//         type="button"
//         className={Styles.closeBtn}
//         title={"Close panel"}
//         onClick={this.hidePanel}
//       >
//         <Icon glyph={Icon.GLYPHS.close} />
//       </button>
//       <Box center>
//         <Box>
//           <Text>
//             <p>{`You aren't logged in as an administrator!
//             None of your edits will save unless you log in.`}</p>
//           </Text>
//         </Box>
//       </Box>
//     </div>
//   );
// }

@observer
class HelpPanel extends React.Component {

  static displayName = "HelpPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
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
    console.log("Bye!");
  }

  render() {
    const { t } = this.props;
    const className = classNames({
      [Styles.helpPanel]: true,
      [Styles.helpPanelShifted]: this.props.viewState.helpPanelExpanded
    });
    return (
      <div className={className}>
        <div
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
        </div>
        <Box
          centered
          css={`
            direction: ltr;
            min-width: 295px;
            padding: 100px 20px;
            padding-bottom: 0px;
            display: inline-block;
          `}
        >
          <Text title>We're here to help</Text>
          <Spacing bottom={5} />
          <Text>
            In hac habitasse platea dictumst.
            Vivamus adipiscing fermentum quam
            volutpat aliquam.
          </Text>
          <Spacing bottom={5} />
          <Box centered>
            <button
              className={Styles.tourBtn}
              title={"Take the tour"}
              // onClick={}
            >
              {" "}
              <Icon glyph={Icon.GLYPHS.bulb} /> {"Take the tour"}{" "}
            </button>
          </Box>
        </Box>
        <Box
          centered
          css={`
            display: inline-block;
          `}
        >
          <Spacing bottom={10} />
          <Box css={`
            display: inline-block;
          `}>
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.controls}
                title={"Navigating 3D Data"}
                itemString={"navigation"}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.splitterOff}
                title={"Split Screen"}
                itemString={"splitscreen"}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.bulb}
                title={"Timeseries Date Picker"}
                itemString={"timeseries"}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.bulb}
                title={"Pulling Away Underground Layers"}
                itemString={"underground"}
              />
          </Box>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpPanel);
