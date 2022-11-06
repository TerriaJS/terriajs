"use strict";
import classNames from "classnames";
import { IReactionDisposer, reaction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import Icon from "../Styled/Icon";
import Styles from "./drag-drop-notification.scss";
import {
  WithViewState,
  withViewState
} from "./StandardUserInterface/ViewStateContext";

interface PropsType extends WithViewState {}

interface IState {
  showNotification: boolean
}

@observer
class DragDropNotification extends React.Component<PropsType, IState> {
  constructor(props: PropsType) {
    super(props);
    this.state = {
      showNotification: false
    };
  }

  notificationTimeout: any = null;
  lastUploadedFilesReaction: IReactionDisposer | null = null;

  componentDidMount() {
    this.lastUploadedFilesReaction = reaction(
      () => this.props.viewState.lastUploadedFiles,
      () => {
        clearTimeout(this.notificationTimeout);
        // show notification, restart timer
        this.setState({
          showNotification: true
        });
        // initialise new time out
        this.notificationTimeout = setTimeout(() => {
          this.setState({
            showNotification: false
          });
        }, 5000);
      }
    );
  }

  componentWillUnmount() {
    clearTimeout(this.notificationTimeout);
    if (this.lastUploadedFilesReaction) {
      this.lastUploadedFilesReaction();
    }
  }

  handleHover() {
    // reset timer on hover
    clearTimeout(this.notificationTimeout);
  }

  handleMouseLeave() {
    this.notificationTimeout = setTimeout(() => {
      this.setState({
        showNotification: false
      });
    }, 4000);
  }

  handleClick() {
    this.props.viewState.openUserData();
  }

  render() {
    const fileNames = this.props.viewState.lastUploadedFiles.join(",");
    return (
      <button
        className={classNames(Styles.notification, {
          [Styles.isActive]: this.state.showNotification && fileNames.length > 0
        })}
        onMouseEnter={this.handleHover.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        onClick={this.handleClick.bind(this)}
      >
        <div className={Styles.icon}>
          <Icon glyph={Icon.GLYPHS.upload} />
        </div>
        <div className={Styles.info}>
          <span className={Styles.filename}>
            {'"'}
            {fileNames}
            {'"'}
          </span>{" "}
          {this.props.viewState.lastUploadedFiles.length > 1 ? "have" : "has"}{" "}
          been added to <span className={Styles.action}>My data</span>
        </div>
      </button>
    );
  }
}

export default withViewState(DragDropNotification);
