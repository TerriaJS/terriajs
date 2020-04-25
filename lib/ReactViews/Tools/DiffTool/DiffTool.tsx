import React from "react";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import ViewState from "../../../ReactViewModels/ViewState";
import CommonStrata from "../../../Models/CommonStrata";
import { action } from "mobx";

type DiffableItem = DiffableMixin.Instance;

interface PropTypes {
  viewState: ViewState;
  sourceItem: DiffableItem;
}

export default class DiffTool extends React.Component<PropTypes> {
  static readonly toolName = "Image Difference";

  private originalSettings: any;

  @action
  enterDiffTool() {
    const { viewState, sourceItem } = this.props;
    const terria = viewState.terria;
    this.originalSettings = {
      showSplitter: terria.showSplitter,
      isMapFullScreen: viewState.isMapFullScreen
    };
    terria.showSplitter = true;
    viewState.isMapFullScreen = true;
    sourceItem.setTrait(CommonStrata.user, "show", false);
  }

  @action
  leaveDiffTool() {
    const { viewState, sourceItem } = this.props;
    const terria = viewState.terria;
    const originalSettings = this.originalSettings;
    terria.showSplitter = originalSettings.showSplitter;
    viewState.isMapFullScreen = originalSettings.isMapFullScreen;
    sourceItem.setTrait(CommonStrata.user, "show", true);
  }

  componentDidMount() {
    this.enterDiffTool();
  }

  componentWillUnmount() {
    this.leaveDiffTool();
  }

  render() {
    return null;
  }
}
