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
        window: PropTypes.object
    },

    getInitialState() {
        return {
            mapImageDataUrl: undefined,
        };
    },

    componentDidMount() {
        return this.props.terria.currentViewer.captureScreenshot().then(mapImageDataUrl => {
            this.setState({
                mapImageDataUrl: mapImageDataUrl
            });
        });
    },

    mapImageLoaded() {
        const imageTags = this.props.window.document.getElementsByTagName('img');

        let allImagesReady = true;
        for (let i = 0; allImagesReady && i < imageTags.length; ++i) {
            allImagesReady = imageTags[i].complete;
        }

        if (allImagesReady) {
            this.props.window.print();
        } else {
            this.props.window.setTimeout(this.mapImageLoaded, 200);
        }
    },

    render() {
        if (!this.state.mapImageDataUrl) {
            return <div>Creating print view...</div>;
        }

        return (
            <div>
                <p>
                    <img className="map-image" src={this.state.mapImageDataUrl} alt="Map snapshot" onLoad={this.mapImageLoaded} />
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

    rect.background {
        width: 100%;
        fill-opacity: 0;
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
 * @returns {Promise} A promise that resolves when the print view has been created.
 */
PrintView.create = function(terria) {
    const printWindow = window.open();

    printWindow.document.title = `${terria.appName} Print View`;
    printWindow.document.head.innerHTML = `
        <title>${terria.appName} Print View</title>
        <style>${PrintView.Styles}</style>
        `;
    printWindow.document.body.innerHTML = '<div id="print"></div>';

    printWindow.onbeforeprint = function() {
        console.log('beginprint');
    };

    printWindow.onload = function() {
        console.log('load');
    };

    printWindow.document.onreadystatechange = function() {
        console.log('readyState: ' + printWindow.document.readyState);
    };

    const printView = <PrintView terria={terria} window={printWindow} />;
    ReactDOM.render(printView, printWindow.document.getElementById('print'));
};

module.exports = PrintView;
