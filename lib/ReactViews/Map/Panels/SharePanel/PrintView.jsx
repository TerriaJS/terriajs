'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import parseCustomHtmlToReact from '../../../Custom/parseCustomHtmlToReact';
import Legend from '../../../Workbench/Controls/Legend';

const PrintView = createReactClass({
    displayName: 'PrintView',

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired,
        onClose: PropTypes.func.isRequired
    },

    getInitialState() {
        return {
            mapImageUrl: '',
        };
    },

    componentWillMount() {
        this.props.terria.currentViewer.captureScreenshot().then(dataUrl => {
            this.setState({
                mapImageUrl: dataUrl
            });
        });
    },

    render() {
        return (
            <div>
                <p>
                    <img className="map-image" src={this.state.mapImageUrl} alt="Map snapshot" />
                </p>
                <h2>Legends</h2>
                {this.props.terria.nowViewing.items.map(this.renderLegend)}
                <h2>Map Credits</h2>
                <ul>
                    {this.props.terria.currentViewer.getAllAttribution().map(this.renderAttribution)}
                </ul>
                <If condition={this.props.terria.configParameters.printDisclaimer}>
                    <h2>Print Disclaimer</h2>
                    <p>
                        <div>{this.props.terria.configParameters.printDisclaimer.text}</div>
                    </p>
                </If>
            </div>
        );
    },

    renderAttribution(attribution) {
        return (<li>{parseCustomHtmlToReact(attribution)}</li>);
    },

    renderLegend(catalogItem) {
        return (
            <div className="layer-legends">
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

module.exports = PrintView;
