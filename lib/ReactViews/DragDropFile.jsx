'use strict';
import React from 'react';
import ObserveModelMixin from './ObserveModelMixin';
import TerriaError from './../Core/TerriaError';
import handleFile from '../Core/handleFile';

const DragDropFile = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object,
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        function callback(c){
            console.log(c);
        };

        const fakeEvent = {
            target: e.dataTransfer
        };
        try {
            handleFile(fakeEvent, this.props.terria, null, callback);
        } catch(err) {
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

    handleMouseLeave(){
        this.props.viewState.isDraggingDroppingFile = false;
    },

    render() {
        return <div onDrop={this.handleDrop}
                    onDragEnter={this.handleDragEnter}
                    onDragOver={this.handleDragOver}
                    onDragLeave={this.handleDragLeave}
                    onMouseLeave = {this.handleMouseLeave}
                    className={(this.props.viewState.isDraggingDroppingFile ? 'is-active' : '') + ' drop-zone'}>
                        <div className='drop-zone-inner'>
                            <h3 className='dnd-heading'> Drag & Drop </h3>
                            <div>Your data anywhere to view on the map</div>
                        </div>
                    </div>;
    }
});

module.exports = DragDropFile;

