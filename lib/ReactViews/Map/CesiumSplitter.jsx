import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import Styles from './cesium-splitter.scss';

import ObserveModelMixin from '../ObserveModelMixin';

const CesiumSplitter = createReactClass({
    displayName: 'CesiumSplitter',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        thumbSize: PropTypes.number,
        padding: PropTypes.number
    },

    getDefaultProps() {
        return {
            thumbSize: 42,
            padding: 0
        };
    },

    getInitialState() {
        const scene = this.props.terria.currentViewer.scene;
        return {
            value: scene ? scene.imagerySplitPosition : 0.5
        };
    },

    componentWillUnmount() {
        this.unsubscribe();
    },

    startDrag(event) {
        // While dragging is in progress, subscribe to document-level movement and up events.
        document.addEventListener('mousemove', this.drag, false);
        document.addEventListener('mouseup', this.stopDrag, false);
        event.preventDefault();
    },

    drag(event) {
        const terria = this.props.terria;
        const viewer = terria.currentViewer;
        if (!viewer || !viewer.scene) {
            return;
        }

        const canvas = viewer.scene.canvas;
        if (!canvas) {
            return;
        }

        const mapRect = canvas.getBoundingClientRect();

        const width = mapRect.right - mapRect.left;
        const fraction = (event.clientX - mapRect.left) / width;

        const min = mapRect.left + this.props.padding + (this.props.thumbSize * 0.5);
        const max = mapRect.right - this.props.padding - (this.props.thumbSize * 0.5);
        const minFraction = (min - mapRect.left) / width;
        const maxFraction = (max - mapRect.left) / width;

        const splitFraction = Math.min(maxFraction, Math.max(minFraction, fraction));

        this.setState({
            value: splitFraction
        });

        viewer.scene.imagerySplitPosition = splitFraction;
        viewer.notifyRepaintRequired();
    },

    stopDrag(event) {
        this.unsubscribe();
    },

    unsubscribe() {
        document.removeEventListener('mousemove', this.drag, false);
        document.removeEventListener('mouseup', this.stopDrag, false);
    },

    getPosition() {
        const terria = this.props.terria;
        const viewer = terria.currentViewer;
        if (!viewer || !viewer.scene) {
            return 50;
        }

        const canvas = viewer.scene.canvas;
        if (!canvas) {
            return 50;
        }

        const canvasWidth = canvas.clientWidth;
        return this.state.value * canvasWidth;
    },

    render() {
        const thumbWidth = this.props.thumbSize;

        const style = {
            left: this.getPosition() + 'px',
            width: thumbWidth + 'px',
            height: thumbWidth + 'px',
            marginLeft: '-' + (thumbWidth * 0.5) + 'px',
            marginTop: '-' + (thumbWidth * 0.5) + 'px',
            lineHeight: (thumbWidth - 2) + 'px',
            borderRadius: (thumbWidth * 0.5) + 'px',
            fontSize: (thumbWidth - 12) + 'px'
        };

        return (
            <div className="cesiumSplitter">
                <div className={Styles.dividerWrapper}>
                    <div className="leaflet-sbs-divider" style={{left: this.getPosition() + 'px'}}></div>
                </div>
                <div className="leaflet-sbs-range" style={style} onMouseDown={this.startDrag}>&#x2980;</div>
            </div>
        );
    }
});

module.exports = CesiumSplitter;
