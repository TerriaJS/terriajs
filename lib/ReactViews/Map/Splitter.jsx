import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Icon from '../Icon.jsx';
import Styles from './splitter.scss';

import ObserveModelMixin from '../ObserveModelMixin';

// Feature detect support for passive: true in event subscriptions.
// See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
let passiveSupported = false;
try {
    const options = Object.defineProperty({}, 'passive', {
        get: function () {
            passiveSupported = true;
        }
    });

    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
} catch (err) { }

const notPassive = passiveSupported ? { passive: false } : false;

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

    componentDidMount() {
        var that = this;
        window.addEventListener('resize', function() {that.resize();});
    },

    componentWillUnmount() {
        this.unsubscribe();
    },

    resize() {
        const smallChange = (this.props.terria.splitPosition < 0.5) ? 0.0001 : -0.0001; // Make sure never <0 or >1.
        this.props.terria.splitPosition += smallChange;
    },

    startDrag(event) {
        const viewer = this.props.terria.currentViewer;
        viewer.pauseMapInteraction();

        // While dragging is in progress, subscribe to document-level movement and up events.
        document.addEventListener('mousemove', this.drag, notPassive);
        document.addEventListener('touchmove', this.drag, notPassive);
        document.addEventListener('mouseup', this.stopDrag, notPassive);
        document.addEventListener('touchend', this.stopDrag, notPassive);

        event.preventDefault();
        event.stopPropagation();
    },

    drag(event) {
        let clientX = event.clientX;
        if (event.targetTouches && event.targetTouches.length > 0) {
            clientX = event.targetTouches.item(0).clientX;
        }

        const viewer = this.props.terria.currentViewer;

        const container = viewer.getContainer();
        const mapRect = container.getBoundingClientRect();

        const width = mapRect.right - mapRect.left;
        const fraction = (clientX - mapRect.left) / width;

        const min = mapRect.left + this.props.padding + (this.props.thumbSize * 0.5);
        const max = mapRect.right - this.props.padding - (this.props.thumbSize * 0.5);
        const minFraction = (min - mapRect.left) / width;
        const maxFraction = (max - mapRect.left) / width;

        const splitFraction = Math.min(maxFraction, Math.max(minFraction, fraction));

        this.props.terria.splitPosition = splitFraction;

        event.preventDefault();
        event.stopPropagation();
    },

    stopDrag(event) {
        this.unsubscribe();

        const viewer = this.props.terria.currentViewer;
        viewer.resumeMapInteraction();

        event.preventDefault();
        event.stopPropagation();
    },

    unsubscribe() {
        document.removeEventListener('mousemove', this.drag, notPassive);
        document.removeEventListener('touchmove', this.drag, notPassive);
        document.removeEventListener('mouseup', this.stopDrag, notPassive);
        document.removeEventListener('touchend', this.stopDrag, notPassive);
        window.removeEventListener('resize', this.resize);
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
                <div className={Styles.thumb} style={thumbStyle} onMouseDown={this.startDrag} onTouchStart={this.startDrag}><Icon glyph={Icon.GLYPHS.splitter}/></div>
            </div>
        );
    }
});

module.exports = Splitter;
