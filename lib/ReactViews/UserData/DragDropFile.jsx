'use strict';

import React from 'react';
import classNames from 'classnames';
import Styles from './drag-drop-file.scss';
import {handleFile} from './addDataFns';

const DragDropFile = React.createClass({
    propTypes: {
        isActive: React.PropTypes.bool,
        terria: React.PropTypes.object,
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const fakeEvent = {
            target: e.dataTransfer
        };

        handleFile(this.props.allowDropInitFile, fakeEvent);
        this.props.onFinishDroppingFile();
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
            handleFile(e);
        }
    },

    render() {
        return (
            <div onDrop={this.handleDrop}
                 onDragEnter={this.handleDragEnter}
                 onDragOver={this.handleDragOver}
                 onDragLeave={this.handleDragLeave}
                 className={classNames(Styles.dropZone, {[Styles.isActive]: this.props.isActive})}>
                <If condition={this.props.isActive}>
                    <div className={Styles.dropZoneInner}>
                        <h3 className={Styles.dndHeading}>Drag & Drop</h3>
                        <div className={Styles.dndHint}>Your data anywhere to view on the map</div>
                    </div>
                </If>
            </div>
        );
    }
});

module.exports = DragDropFile;

