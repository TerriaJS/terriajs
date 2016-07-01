import React from 'react';
import classNames from 'classnames';

import ObserveModelMixin from './ObserveModelMixin';
import TerriaError from './../Core/TerriaError';
import handleFile from '../Core/handleFile';

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

        const fakeEvent = {
            target: e.dataTransfer
        };
        try {
            handleFile(fakeEvent, this.props.terria, this.props.viewState, null, ()=> {
                this.props.viewState.myDataIsUploadView = false;
            });
        } catch (err) {
            this.props.terria.error.raiseEvent(new TerriaError({
                sender: this,
                title: err.title,
                message: err.message
            }));
        }
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

