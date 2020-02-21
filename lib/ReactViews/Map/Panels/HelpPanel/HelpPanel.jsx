import classNames from "classnames";
// import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
// import Sortable from "react-anything-sortable";
import { withTranslation } from "react-i18next";
// import combine from "terriajs-cesium/Source/Core/combine";
// import createGuid from "terriajs-cesium/Source/Core/createGuid";
// import defined from "terriajs-cesium/Source/Core/defined";
// import triggerResize from "../../Core/triggerResize";
// import BadgeBar from "../BadgeBar.jsx";
import Icon from "../../../Icon.jsx";
// import Loader from "../Loader";
// import { getShareData } from "../Map/Panels/SharePanel/BuildShareLink";
import Styles from "./help-panel.scss";
// import Story from "./Story.jsx";
// import StoryEditor from "./StoryEditor.jsx";
import { action } from "mobx";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import MapIconButton from "../../../MapIconButton/MapIconButton";
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
      <div 
        className={className}
        onClick={this.handleClick}
      >
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
          <Text title>We&apos;re here to help</Text>
          <Spacing bottom={5} />
          <Text medium>
            In hac habitasse platea dictumst. Vivamus adipiscing fermentum quam
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
              <Icon glyph={Icon.GLYPHS.tour} /> {"Take the tour"}{" "}
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
                title={"Navigating 3D data"}
                itemString={"navigation"}
                description={[
                  "One of the key features of the NSW Spatial Digital Twin is the ability to add and view 3D data, including 3D imagery, or photo reality mesh. This is an interactive way to explore high resolution, 3D aerial imagery of some areas of NSW.",
                  "In this video, we’ll show you how to add 3D data to the Digital Twin, and then use the navigation controls to view it in 3D."
                ]}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.splitterOff}
                title={"Compare changes across a location"}
                itemString={"splitscreen"}
                description={[
                  "Using the NSW Spatial Digital Twin, you can also compare a dataset at different points in time. This can help you to easily visualise and analyse the difference between an a place at two different points in time.",
                  "In this video, we’ll show you how to use the ‘Compare’ functionality to view changes across a dataset, using our split screen functionality. We use the visual example of satellite imagery around Penrith before and during the NSW 2019 bushfires, showing the smoke haze."
                ]}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.datePicker}
                title={"Interacting with time-series data"}
                itemString={"timeseries"}
                description={[
                  "Another key feature of the NSW Spatial Digital Twin is the ability to explore the fourth dimension of a dataset, time. For datasets that have a 4D attribute available, you can use the Digital Twin to navigate backwards and forwards in time and see how the data and landscape changes.",
                  "In this video, we’ll show you how to use the 4D time-series controls using the Digital Twin."
                ]}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.layers}
                title={"Swiping away underground datasets"}
                itemString={"underground"}
                description={[
                  "The NSW Spatial Digital Twin will allow you to ‘swipe away’ the terrain to view underground assets, such as water mains or sewer pipes’, in relation to the landscape around it.",
                  "In this video, we’ll show you how to use the split screen feature and map settings to see below ground, in relation to the environment around it."
                ]}
              />
          </Box>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpPanel);
