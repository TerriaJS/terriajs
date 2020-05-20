import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import addUserFiles from "../Models/addUserFiles";
import { Trans, withTranslation } from "react-i18next";

import { observer } from "mobx-react";
import { flow, action } from "mobx";

import Styles from "./drag-drop-file.scss";

@observer
class DragDropFile extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object
  };

  target = null;

  handleDrop = flow(function*(e) {
    e.preventDefault();
    e.stopPropagation();

    const addedCatalogItems = yield addUserFiles(
      e.dataTransfer.files,
      this.props.terria,
      this.props.viewState,
      null
    );

    if (addedCatalogItems.length > 0) {
      this.props.viewState.myDataIsUploadView = false;
      if (this.props.viewState.explorerPanelIsVisible) {
        this.props.viewState.viewCatalogMember(addedCatalogItems[0]);
        this.props.viewState.openUserData();
      } else {
        // update last batch of uploaded files
        this.props.viewState.lastUploadedFiles = addedCatalogItems.map(
          item => item.name
        );
      }
    }

    this.props.viewState.isDraggingDroppingFile = false;
  });

  @action
  handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    this.lastTarget = e.target;
  }

  handleDragOver(e) {
    e.preventDefault();
  }

  @action
  handleDragLeave(e) {
    e.preventDefault();
    if (e.screenX === 0 && e.screenY === 0) {
      this.props.viewState.isDraggingDroppingFile = false;
    }
    if (e.target === document || e.target === this.lastTarget) {
      this.props.viewState.isDraggingDroppingFile = false;
    }
  }

  @action
  handleMouseLeave() {
    this.props.viewState.isDraggingDroppingFile = false;
  }

  render() {
    return (
      <div
        onDrop={this.handleDrop.bind(this)}
        onDragEnter={this.handleDragEnter.bind(this)}
        onDragOver={this.handleDragOver.bind(this)}
        onDragLeave={this.handleDragLeave.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        className={classNames(Styles.dropZone, {
          [Styles.isActive]: this.props.viewState.isDraggingDroppingFile
        })}
      >
        <If condition={this.props.viewState.isDraggingDroppingFile}>
          <div className={Styles.inner}>
            <Trans i18nKey="dragDrop.text">
              <h3 className={Styles.heading}>Drag & Drop</h3>
              <div className={Styles.caption}>
                Your data anywhere to view on the map
              </div>
            </Trans>
          </div>
        </If>
      </div>
    );
  }
}
module.exports = withTranslation()(DragDropFile);
