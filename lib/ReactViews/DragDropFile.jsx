'use strict';
import React from 'react';

const DragDropFile = React.createClass({
    propTypes: {
        isActive: React.PropTypes.bool,
        terria: React.PropTypes.object,
        handleFile: React.PropTypes.func,
        onFinishDroppingFile: React.PropTypes.func
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const fakeEvent = {
            target: e.dataTransfer
        };

        this.props.handleFile(fakeEvent);
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
            this.props.onFinishDroppingFile();
        }
    },

    render() {
        return <div onDrop={this.handleDrop}
                    onDragEnter={this.handleDragEnter}
                    onDragOver={this.handleDragOver}
                    onDragLeave={this.handleDragLeave}
                    className={(this.props.isActive ? 'is-active' : '') + ' drop-zone'}><h1> Drag & Drop File </h1></div>;
    }
});

module.exports = DragDropFile;

