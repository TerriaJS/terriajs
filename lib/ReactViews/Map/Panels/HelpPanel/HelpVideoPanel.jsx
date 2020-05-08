import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Icon from "../../../Icon.jsx";
import Styles from "./help-panel.scss";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import VideoGuide from "./VideoGuide";

const HELP_VIDEO_NAME = "helpVideo";

@observer
class HelpVideoPanel extends React.Component {
  static displayName = "HelpVideoPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    itemString: PropTypes.string,
    description: PropTypes.array,
    videoLink: PropTypes.string,
    background: PropTypes.string,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    // const { t } = this.props;
    const itemSelected =
      this.props.viewState.selectedHelpMenuItem === this.props.itemString;
    const isExpanded = this.props.viewState.selectedHelpMenuItem !== "";
    const className = classNames({
      [Styles.videoPanel]: true,
      [Styles.isVisible]: isExpanded,
      // when the help entire video panel is invisible (hidden away to the right)
      [Styles.shiftedToRight]:
        !isExpanded ||
        !this.props.viewState.showHelpMenu ||
        this.props.viewState.topElement !== "HelpPanel",
      [Styles.isHidden]: !itemSelected // when the item isn't selected
    });
    return (
      <div className={className}>
        <VideoGuide
          viewState={this.props.viewState}
          videoLink={this.props.videoLink}
          background={this.props.background}
          videoName={HELP_VIDEO_NAME}
        />
        <Box
          centered
          fullWidth
          fullHeight
          displayInlineBlock
          paddedHorizontally={4}
          paddedVertically={18}
        >
          <div
            className={Styles.videoLink}
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)), url(${this.props.background})`
            }}
          >
            <button
              className={Styles.videoBtn}
              onClick={() =>
                this.props.viewState.setVideoGuideVisible(HELP_VIDEO_NAME)
              }
            >
              <Icon glyph={Icon.GLYPHS.play} />
            </button>
          </div>
          <Spacing bottom={5} />
          <Text subHeading bold textDark>
            {this.props.title}
          </Text>
          <For each="desc" of={this.props.description}>
            <Spacing bottom={3} />
            <Text medium textDark>
              {desc}
            </Text>
          </For>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(withTheme(HelpVideoPanel));
