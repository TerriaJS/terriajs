import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import ObserveModelMixin from './ObserveModelMixin';
import addUserFiles from '../Models/addUserFiles';

import Styles from './drag-drop-file.scss';

const DragDropFile = createReactClass({
    displayName: 'DragDropFile',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object,
    },

    target: null,

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        addUserFiles(e.dataTransfer.files, this.props.terria, this.props.viewState, null)
            .then(addedCatalogItems => {
                if (addedCatalogItems.length > 0) {
                    this.props.viewState.myDataIsUploadView = false;
                    this.props.viewState.viewCatalogMember(addedCatalogItems[0]);
                    this.notifyUpload(addedCatalogItems);
                }
            });

        this.props.viewState.isDraggingDroppingFile = false;
    },

    notifyUpload(addedCatalogItems) {
      // if explorer panel is not open, we show a notification
      // slide in right, wait 3 + 2 seconds (plus transition time), then slide out right
      if(!this.props.viewState.explorerPanelIsVisible) {
        this.props.viewState.recentlyUploadedFiles = addedCatalogItems.map(item => item.data.name);
        setTimeout(
            ()=> {
                this.props.viewState.recentlyUploadedFiles = [];
            },5000);
      }
    },

    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        this.lastTarget = e.target;
    },

    handleDragOver(e) {
        e.preventDefault();
    },

    handleDragLeave(e) {
        e.preventDefault();
        if (e.screenX === 0 && e.screenY === 0) {
            this.props.viewState.isDraggingDroppingFile = false;
        }
         if (e.target === document || e.target === this.lastTarget) {
             this.props.viewState.isDraggingDroppingFile = false;
         }
    },

    handleMouseLeave() {
        this.props.viewState.isDraggingDroppingFile = false;
    },

    render() {
        return (
            <div onDrop={this.handleDrop}
                 onDragEnter={this.handleDragEnter}
                 onDragOver={this.handleDragOver}
                 onDragLeave={this.handleDragLeave}
                 onMouseLeave={this.handleMouseLeave}
                 className={classNames(Styles.dropZone, {[Styles.isActive]: this.props.viewState.isDraggingDroppingFile})}>
                <If condition={this.props.viewState.isDraggingDroppingFile}>
                    <div className={Styles.inner}>
                        <h3 className={Styles.heading}>Drag & Drop</h3>
                        <div className={Styles.caption}>Your data anywhere to view on the map</div>
                    </div>
                </If>
            </div>
        );
    },
});

module.exports = DragDropFile;
