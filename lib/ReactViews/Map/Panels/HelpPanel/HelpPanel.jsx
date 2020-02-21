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
    const descriptionArray = [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut pretium pretium tempor. Ut eget imperdiet neque. In volutpat ante semper diam molestie, et aliquam erat laoreet.",
      "Sed sit amet arcu aliquet, molestie justo at, auctor nunc. Phasellus ligula ipsum, volutpat eget semper id, viverra eget nibh. Suspendisse luctus mattis cursus. Nam consectetur ante at nisl hendrerit gravida. Donec vehicula rhoncus mattis. Mauris dignissim semper mattis.",
      "Fusce porttitor a mi at suscipit. Praesent \
      facilisis dolor sapien, vel sodales augue \
      mollis ut. Mauris venenatis magna eu tortor \
      posuere luctus. Aenean tincidunt turpis sed \
      dui aliquam vehicula. Praesent nec elit non \
      dolor consectetur tincidunt sed in felis. \
      Donec elementum, lacus at mattis tincidunt, \
      eros magna faucibus sem, in condimentum est \
      augue tristique risus."
    ];
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
            padding: 100px 20px;
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
                title={"Navigating 3D Data"}
                itemString={"navigation"}
                description={descriptionArray}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.splitterOff}
                title={"Split Screen"}
                itemString={"splitscreen"}
                description={descriptionArray}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.datePicker}
                title={"Timeseries Date Picker"}
                itemString={"timeseries"}
                description={descriptionArray}
              />
              <HelpPanelItem 
                terria={this.props.terria}
                viewState={this.props.viewState}
                iconElement={Icon.GLYPHS.layers}
                title={"Pulling Away Underground Layers"}
                itemString={"underground"}
                description={descriptionArray}
              />
          </Box>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(HelpPanel);
