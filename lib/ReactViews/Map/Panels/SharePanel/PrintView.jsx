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
        const mapImageStyle = {
            'max-width': '95vw',
            'max-height': '95vh'
        };

        const legendListStyle = {
            'list-style': 'none'
        };

        return (
            <div>
                <p>
                    <img style={mapImageStyle} src={this.state.mapImageUrl} alt="Map snapshot" />
                </p>
                <h2>Legends</h2>
                {this.props.terria.nowViewing.items.map(this.renderLegend)}
                <h2>Map Credits</h2>
                <ul>
                    {this.props.terria.currentViewer.getAllAttribution().map(this.renderAttribution)}
                </ul>
                <h2>Print Disclaimer</h2>
                <p>
                    <div>{this.props.terria.configParameters.printDisclaimer.text}</div>
                </p>
            </div>
        );
    },

    renderAttribution(attribution) {
        return (<li>{parseCustomHtmlToReact(attribution)}</li>);
    },

    renderLegend(catalogItem) {
        return (
            <div>
                <div>{catalogItem.name}</div>
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
`;

module.exports = PrintView;
