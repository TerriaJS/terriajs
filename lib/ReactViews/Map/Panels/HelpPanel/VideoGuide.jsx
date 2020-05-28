import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import styled from "styled-components";
import Box from "../../../../Styled/Box";
import FadeIn from "../../../Transitions/FadeIn/FadeIn";
import Loader from "../../../Loader";
import { useKeyPress } from "../../../Hooks/useKeyPress.js";

// const VideoWrapperBox = styled(Box)`
//   position: fixed;
//   z-index: 99999;
//   top: 0;
//   left: 0;
//   right: 0;
//   bottom: 0;
//   background: rgba(0, 0, 0, 0.6);
// `;

const VideoWrapperBox = props => {
  const { viewState } = props;
  const handleClose = () => viewState.setVideoGuideVisible("");

  useKeyPress("Escape", () => {
    handleClose();
  });

  return (
    <Box
      centered
      onClick={e => {
        handleClose();
        e.stopPropagation();
      }}
      css={`
        position: fixed;
        z-index: 99999;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
      `}
    >
      {props.children}
    </Box>
  );
};

@observer
class VideoGuide extends React.Component {
  static displayName = "VideoGuide";

  static propTypes = {
    viewState: PropTypes.object.isRequired,
    videoLink: PropTypes.string,
    background: PropTypes.string,
    videoName: PropTypes.string,
    theme: PropTypes.object,
    t: PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <FadeIn
        isVisible={
          this.props.viewState.videoGuideVisible === this.props.videoName
        }
      >
        <VideoWrapperBox
          viewState={this.props.viewState}
          // centered
          // onClick={e => {
          //   this.props.viewState.setVideoGuideVisible("");
          //   e.stopPropagation();
          // }}
        >
          <Box
            centered
            col11
            styledHeight={"90%"}
            backgroundImage={this.props.background}
            css={`
              svg {
                fill: #fff;
                width: 60px;
                height: 60px;
                top: -30px;
                left: -30px;
              }
            `}
            onClick={e => e.stopPropagation()}
          >
            <Loader message={` `} />
            <iframe
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
