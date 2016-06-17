'use strict';
import React from 'react';

const DragDropFile = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        handleFile: React.PropTypes.func,
        viewState: React.PropTypes.object,
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const fakeEvent = {
            target: e.dataTransfer
        };

        this.props.handleFile(fakeEvent);
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

    render() {
        return <div onDrop={this.handleDrop}
                    onDragEnter={this.handleDragEnter}
                    onDragOver={this.handleDragOver}
                    onDragLeave={this.handleDragLeave}
                    className={(this.props.viewState.isDraggingDroppingFile === true ? 'is-active' : '') + ' drop-zone'}>
                        <div className='drop-zone-inner'>
                            <h3 className='dnd-heading'> Drag & Drop </h3>
                            <div>Your data anywhere to view on the map</div>
                        </div>
                    </div>;
    }
});

module.exports = DragDropFile;

