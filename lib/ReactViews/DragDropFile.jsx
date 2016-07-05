import React from 'react';
import classNames from 'classnames';

import ObserveModelMixin from './ObserveModelMixin';
import addUserFiles from '../Models/addUserFiles';

import Styles from './drag-drop-file.scss';

const DragDropFile = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object,
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        addUserFiles(e.dataTransfer.files, this.props.terria, this.props.viewState, null)
            .then(addedCatalogItems => {
                if (addedCatalogItems.length > 0) {
                    this.props.viewState.myDataIsUploadView = false;
                }
            });

        this.props.viewState.isDraggingDroppingFile = false;
    },

    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    },

    handleDragOver(e) {
        e.preventDefault();
    },

    handleDragLeave(e) {
        if (e.screenX === 0 && e.screenY === 0) {
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
    }
});

module.exports = DragDropFile;

