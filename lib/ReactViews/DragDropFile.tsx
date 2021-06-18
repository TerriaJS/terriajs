import classNames from "classnames";
import { action, flow } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Trans, withTranslation, WithTranslation } from "react-i18next";
import isDefined from "../Core/isDefined";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import addUserFiles from "../Models/addUserFiles";
import { BaseModel } from "../Models/Model";
import Terria from "../Models/Terria";
import ViewState from "../ReactViewModels/ViewState";
import Styles from "./drag-drop-file.scss";

interface PropsType extends WithTranslation {
  terria: Terria;
  viewState: ViewState;
}

@observer
class DragDropFile extends React.Component<PropsType> {
  target: EventTarget | undefined;

  handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    const props = this.props;
    flow(function*() {
      const addedCatalogItems: BaseModel[] | undefined = yield addUserFiles(
        e.dataTransfer.files,
        props.terria,
        props.viewState
      );

      if (isDefined(addedCatalogItems) && addedCatalogItems.length > 0) {
        props.viewState.myDataIsUploadView = false;
        if (props.viewState.explorerPanelIsVisible) {
          props.viewState.viewCatalogMember(addedCatalogItems[0]);
          props.viewState.openUserData();
        } else {
          // update last batch of uploaded files
          props.viewState.lastUploadedFiles = addedCatalogItems.map(item =>
            CatalogMemberMixin.isMixedInto(item) ? item.name : item.uniqueId
          );
        }

        // Add load all mapable items
        const mappableItems = addedCatalogItems.filter(
          MappableMixin.isMixedInto
        );

        yield Promise.all(mappableItems.map(f => f.loadMapItems()));

        // Zoom to first item
        const firstZoomableItem = mappableItems.find(i =>
          isDefined(i.rectangle)
        );

        isDefined(firstZoomableItem) &&
          props.terria.currentViewer.zoomTo(firstZoomableItem, 1);
      }

      props.viewState.isDraggingDroppingFile = false;
    })();
  }

  @action
  handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    this.target = e.target;
  }

  handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  @action
  handleDragLeave(e: React.MouseEvent) {
    e.preventDefault();
    if (e.screenX === 0 && e.screenY === 0) {
      this.props.viewState.isDraggingDroppingFile = false;
    }
    if (e.target === document || e.target === this.target) {
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
        {this.props.viewState.isDraggingDroppingFile ? (
          <div className={Styles.inner}>
            <Trans i18nKey="dragDrop.text">
              <h3 className={Styles.heading}>Drag & Drop</h3>
              <div className={Styles.caption}>
                Your data anywhere to view on the map
              </div>
            </Trans>
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
}
module.exports = withTranslation()(DragDropFile);
