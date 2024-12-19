import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Icon from "../../../../Styled/Icon";
import Styles from "./help-panel.scss";
import Spacing from "../../../../Styled/Spacing";
import Box from "../../../../Styled/Box";
import VideoGuide from "./VideoGuide";
import TrainerPane from "./TrainerPane";
import StyledHtml from "./StyledHtml";
import SatelliteGuide from "../../../Guide/SatelliteGuide";

const HELP_VIDEO_NAME = "helpVideo";

@observer
class HelpVideoPanel extends React.Component {
  static displayName = "HelpVideoPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    itemString: PropTypes.string,
    paneMode: PropTypes.string,
    markdownContent: PropTypes.string,
    videoUrl: PropTypes.string,
    placeholderImage: PropTypes.string,
    videoCoverImageOpacity: PropTypes.number,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired
  };

  render() {
    // @ts-expect-error TS(2339): Property 'paneMode' does not exist on type 'Readon... Remove this comment to see the full error message
    const helpItemType = this.props.paneMode || "videoAndContent"; // default is video panel
    const itemSelected =
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.selectedHelpMenuItem === this.props.itemString;
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const isExpanded = this.props.viewState.selectedHelpMenuItem !== "";
    const className = classNames({
      [Styles.videoPanel]: true,
      [Styles.isVisible]: isExpanded,
      // when the help entire video panel is invisible (hidden away to the right)
      [Styles.shiftedToRight]:
        !isExpanded ||
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        !this.props.viewState.showHelpMenu ||
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.topElement !== "HelpPanel"
    });
    return (
      itemSelected && (
        <div className={className}>
          <VideoGuide
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
            // @ts-expect-error TS(2339): Property 'videoUrl' does not exist on type 'Readon... Remove this comment to see the full error message
            videoLink={this.props.videoUrl}
            // @ts-expect-error TS(2339): Property 'placeholderImage' does not exist on type... Remove this comment to see the full error message
            background={this.props.placeholderImage}
            // @ts-expect-error TS(2339): Property 'videoCoverImageOpacity' does not exist o... Remove this comment to see the full error message
            backgroundOpacity={this.props.videoCoverImageOpacity}
            videoName={HELP_VIDEO_NAME}
          />
          <Box
            centered
            fullWidth
            fullHeight
            displayInlineBlock
            paddedHorizontally={4}
            paddedVertically={18}
            css={`
              overflow: auto;
              overflow-x: hidden;
              overflow-y: auto;
            `}
            scroll
          >
            {helpItemType === "videoAndContent" && (
              <>
                // @ts-expect-error TS(2339): Property 'videoUrl' does not exist
                on type 'Readon... Remove this comment to see the full error
                message
                {this.props.videoUrl && this.props.placeholderImage && (
                  <div key={"image"}>
                    <div
                      className={Styles.videoLink}
                      style={{
                        // @ts-expect-error TS(2339): Property 'placeholderImage' does not exist on type... Remove this comment to see the full error message
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)), url(${this.props.placeholderImage})`
                      }}
                    >
                      <button
                        className={Styles.videoBtn}
                        onClick={() =>
                          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                          this.props.viewState.setVideoGuideVisible(
                            HELP_VIDEO_NAME
                          )
                        }
                      >
                        <Icon glyph={Icon.GLYPHS.play} />
                      </button>
                    </div>
                    <Spacing bottom={5} />
                  </div>
                )}
                // @ts-expect-error TS(2339): Property 'markdownContent' does
                not exist on type ... Remove this comment to see the full error
                message
                {this.props.markdownContent && (
                  <StyledHtml
                    key={"markdownContent"}
                    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                    viewState={this.props.viewState}
                    // @ts-expect-error TS(2339): Property 'markdownContent' does not exist on type ... Remove this comment to see the full error message
                    markdown={this.props.markdownContent}
                  />
                )}
              </>
            )}
            {helpItemType === "slider" && (
              <SatelliteGuide
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
              />
            )}
            {helpItemType === "trainer" && (
              <TrainerPane
                // @ts-expect-error TS(2339): Property 'content' does not exist on type 'Readonl... Remove this comment to see the full error message
                content={this.props.content}
                // @ts-expect-error TS(2322): Type '{ content: any; terria: any; viewState: any;... Remove this comment to see the full error message
                terria={this.props.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
              />
            )}
          </Box>
        </div>
      )
    );
  }
}

export default withTranslation()(withTheme(HelpVideoPanel));
