import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import Styles from './cesium-splitter.scss';

import ObserveModelMixin from '../ObserveModelMixin';

const Splitter = createReactClass({
    displayName: 'Splitter',
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

    componentWillUnmount() {
        this.unsubscribe();
    },

    startDrag(event) {
        const viewer = this.props.terria.currentViewer;
        viewer.pauseMapInteraction();

        // While dragging is in progress, subscribe to document-level movement and up events.
        document.addEventListener('mousemove', this.drag, false);
        document.addEventListener('mouseup', this.stopDrag, false);

        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    drag(event) {
        const viewer = this.props.terria.currentViewer;

        const container = viewer.getContainer();
        const mapRect = container.getBoundingClientRect();

        const width = mapRect.right - mapRect.left;
        const fraction = (event.clientX - mapRect.left) / width;

        const min = mapRect.left + this.props.padding + (this.props.thumbSize * 0.5);
        const max = mapRect.right - this.props.padding - (this.props.thumbSize * 0.5);
        const minFraction = (min - mapRect.left) / width;
        const maxFraction = (max - mapRect.left) / width;

        const splitFraction = Math.min(maxFraction, Math.max(minFraction, fraction));

        this.props.terria.splitPosition = splitFraction;

        event.preventDefault();
    },

    stopDrag(event) {
        this.unsubscribe();

        const viewer = this.props.terria.currentViewer;
        viewer.resumeMapInteraction();
    },

    unsubscribe() {
        document.removeEventListener('mousemove', this.drag, false);
        document.removeEventListener('mouseup', this.stopDrag, false);
    },

    getPosition() {
        const canvasWidth = this.props.terria.currentViewer.getContainer().clientWidth;
        return this.props.terria.splitPosition * canvasWidth;
    },

    render() {
        if (!this.props.terria.showSplitter) {
            return null;
        }

        const thumbWidth = this.props.thumbSize;

        const dividerStyle = {
            left: this.getPosition() + 'px',
            backgroundColor: this.props.terria.baseMapContrastColor
        };

        const thumbStyle = {
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
            <div>
                <div className={Styles.dividerWrapper}>
                    <div className={Styles.divider} style={dividerStyle}></div>
                </div>
                <div className={Styles.thumb} style={thumbStyle} onMouseDown={this.startDrag}>&#x2980;</div>
            </div>
        );
    }
});

module.exports = Splitter;
