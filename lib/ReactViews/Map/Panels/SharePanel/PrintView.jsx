'use strict';

import createReactClass from 'create-react-class';
import DOMPurify from 'dompurify/dist/purify';
import Legend from '../../../Workbench/Controls/Legend';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

const PrintView = createReactClass({
    displayName: 'PrintView',

    propTypes: {
        terria: PropTypes.object,
        window: PropTypes.object,
        readyCallback: PropTypes.func
    },

    getInitialState() {
        return {
            mapImageDataUrl: undefined,
            ready: false,
            printingStarted: false
        };
    },

    componentDidMount() {
        return this.props.terria.currentViewer.captureScreenshot().then(mapImageDataUrl => {
            // We need to periodically check whether all images are loaded.
            // We can theoretically do that either with a setInterval on the original TerriaJS window,
            // or on the print view window. But:
            //    * Chrome (as of v66.0.3359.139 anyway) seems to aggressively suspend setInterval calls in background
            // tabs, so only a setInterval on the print view window works reliably.
            //    * Internet Explorer 11 does not seem to allow a cross-window setInterval call, so only a setInterval
            // on the original TerriaJS window works reliably.
            // So, we'll do both.

            const printWindow = this.props.window;
            const mainWindow = window;

            const printWindowIntervalId = printWindow.setInterval(this.checkForImagesReady, 200);
            const mainWindowIntervalId = mainWindow.setInterval(this.checkForImagesReady, 200);

            this._stopCheckingForImages = () => {
                printWindow.clearInterval(printWindowIntervalId);
                mainWindow.clearInterval(mainWindowIntervalId);
                this._stopCheckingForImages = undefined;
            };

            this.setState({
                mapImageDataUrl: mapImageDataUrl
            });
        });
    },

    componentWillUnmount() {
        this.stopCheckingForImages();
    },

    componentDidUpdate() {
        if (this.state.ready && !this.state.printingStarted) {
            if (this.props.readyCallback) {
                this.props.readyCallback(this.props.window);
            }
            this.setState({
                printingStarted: true
            });
        }
    },

    stopCheckingForImages() {
        if (this._stopCheckingForImages) {
            this._stopCheckingForImages();
        }
    },

    checkForImagesReady() {
        if (this.state.ready) {
            return;
        }

        const imageTags = this.props.window.document.getElementsByTagName('img');

        let allImagesReady = true;
        for (let i = 0; allImagesReady && i < imageTags.length; ++i) {
            allImagesReady = imageTags[i].complete;
        }

        if (allImagesReady) {
            this.stopCheckingForImages();
            this.setState({
                ready: allImagesReady
            });
        }
    },

    render() {
        if (!this.state.mapImageDataUrl) {
            return <div>Creating print view...</div>;
        }

        return (
            <div>
                <p>
                    <img className="map-image" src={this.state.mapImageDataUrl} alt="Map snapshot" />
                </p>
                <h2>Legends</h2>
                {this.props.terria.nowViewing.items.map(this.renderLegend)}
                <h2>Map Credits</h2>
                <ul>
                    {this.props.terria.currentViewer.getAllAttribution().map(this.renderAttribution)}
                </ul>
                <If condition={this.props.terria.configParameters.printDisclaimer}>
                    <h2>Print Disclaimer</h2>
                    <p>{this.props.terria.configParameters.printDisclaimer.text}</p>
                </If>
            </div>
        );
    },

    renderAttribution(attribution) {
        // For reasons I don't entirely understanding, using parseCustomHtmlToReact instead
        // of dangerouslySetInnerHTML here doesn't work in IE11 or Edge. All elements after
        // the first attribution end up just completely missing from the DOM.
        const html = { __html: DOMPurify.sanitize(attribution) };
        return (<li key={attribution} dangerouslySetInnerHTML={html}></li>);
    },

    renderLegend(catalogItem) {
        return (
            <div key={catalogItem.uniqueId} className="layer-legends">
                <div className="layer-title">{catalogItem.name}</div>
                <Legend item={catalogItem} />
            </div>
        );
    }
});

PrintView.Styles = `
    .tjs-_base__list-reset {
        list-style: none;
        padding-left: 0;
        margin: 0;
    }

    .background {
        width: 100%;
        fill: rgba(255, 255, 255, 1.0);
    }

    .map-image {
        max-width: 95vw;
        max-height: 95vh;
    }

    .layer-legends {
        display: inline;
        float: left;
        padding-left: 20px;
        padding-right: 20px;
    }

    .layer-title {
        font-weight: bold;
    }

    h2 {
        clear: both;
    }
`;

/**
 * Creates a new printable view.
 *
 * @param {Terria} terria The Terria instance.
 * @param {Window} [printWindow] The window in which to create the print view. This is usually a new window created with
 *                 `window.open()` or an iframe's `contentWindow`. If undefined, a new window (tab) will be created.
 * @param {Function} [readyCallback] A function that is called when the print view is ready to be used. The function is
 *                   given the print view window as its only parameter.
 * @param {Function} [closeCallback] A function that is called when the print view is closed. The function is given
 *                   the print view window as its only parameter.
 * @returns {Promise} A promise that resolves when the print view has been created.
 */
PrintView.create = function(terria, printWindow, readyCallback, closeCallback) {
    printWindow = printWindow || window.open();

    if (closeCallback) {
        printWindow.addEventListener('unload', () => {
            closeCallback(printWindow);
        });
    }

    printWindow.document.title = `${terria.appName} Print View`;
    printWindow.document.head.innerHTML = `
        <title>${terria.appName} Print View</title>
        <style>${PrintView.Styles}</style>
        `;
    printWindow.document.body.innerHTML = '<div id="print"></div>';

    const printView = <PrintView terria={terria} window={printWindow} readyCallback={readyCallback} />;
    ReactDOM.render(printView, printWindow.document.getElementById('print'));
};

module.exports = PrintView;
