import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Box from "../../../../Styled/Box";
import FadeIn from "../../../Transitions/FadeIn/FadeIn";
import Loader from "../../../Loader";
import { useKeyPress } from "../../../Hooks/useKeyPress.js";
import { RawButton } from "../../../../Styled/Button";
import Icon, { StyledIcon } from "../../../../Styled/Icon";

const VideoWrapperBox = (props: any) => {
  const { viewState } = props;
  const handleClose = () => viewState.setVideoGuideVisible("");

  useKeyPress("Escape", () => {
    handleClose();
  });

  return (
    <Box
      centered
      onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}
      css={`
        position: fixed;
        z-index: 99999;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.75);
      `}
    >
      <Box paddedRatio={4} position="absolute" topRight>
        <RawButton onClick={handleClose.bind(null)}>
          <StyledIcon
            styledWidth={"22px"}
            light
            glyph={Icon.GLYPHS.closeLight}
          />
        </RawButton>
      </Box>
      {props.children}
    </Box>
  );
};

VideoWrapperBox.propTypes = {
  viewState: PropTypes.object.isRequired,
  children: PropTypes.node
};

@observer
class VideoGuide extends React.Component {
  static displayName = "VideoGuide";

  static propTypes = {
    viewState: PropTypes.object.isRequired,
    videoName: PropTypes.string.isRequired,
    videoLink: PropTypes.string,
    background: PropTypes.string,
    // A number between 0 and 1.0
    backgroundOpacity: PropTypes.number,
    theme: PropTypes.object,
    t: PropTypes.func
  };

  render() {
    // @ts-expect-error TS(2339): Property 'backgroundOpacity' does not exist on typ... Remove this comment to see the full error message
    const backgroundOpacity = this.props.backgroundOpacity;
    const backgroundBlackOverlay =
      backgroundOpacity === undefined ? undefined : 1.0 - backgroundOpacity;
    return (
      <FadeIn
        isVisible={
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          this.props.viewState.videoGuideVisible === this.props.videoName
        }
      >
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on
        type 'Reado... Remove this comment to see the full error message
        <VideoWrapperBox viewState={this.props.viewState}>
          <Box
            centered
            col11
            styledHeight={"87%"}
            // @ts-expect-error TS(2339): Property 'background' does not exist on type 'Read... Remove this comment to see the full error message
            backgroundImage={this.props.background}
            backgroundBlackOverlay={backgroundBlackOverlay}
            css={`
              svg {
                fill: #fff;
                width: 60px;
                height: 60px;
                top: -30px;
                left: -30px;
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <Loader message={` `} />
            <iframe
              // @ts-expect-error TS(2339): Property 'videoLink' does not exist on type 'Reado... Remove this comment to see the full error message
              src={this.props.videoLink}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              css={`
                border: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
              `}
            />
          </Box>
        </VideoWrapperBox>
      </FadeIn>
    );
  }
}

export default withTranslation()(withTheme(VideoGuide));
