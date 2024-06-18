import React from "react";
import ViewState from "../../../../ReactViewModels/ViewState";

interface PropsType {
  viewState: ViewState;
  videoName: string;
  videoLink: string;
  background: string;
  // A number between 0 and 1.0
  backgroundOpacity?: number;
}

declare class VideoGuide extends React.Component<PropsType> {}
export default VideoGuide;
