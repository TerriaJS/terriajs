'use strict';

import Mustache from 'mustache';
import React from 'react';
import HtmlToReact from 'html-to-react';

import defined from 'terriajs-cesium/Source/Core/defined';

import markdownToHtml from '../Core/markdownToHtml';

const htmlToReactParser = new HtmlToReact.Parser(React);

// Individual feature info section
const FeatureInfoSection = React.createClass({
    propTypes: {
        template: React.PropTypes.object,
        feature: React.PropTypes.object,
        clock: React.PropTypes.object,
        catalogItemName: React.PropTypes.string,
        index: React.PropTypes.number
    },

    getInitialState() {
        return {
            isOpen: this.props.index === 0
        };
    },

    componentWillReceiveProps() {
        this.setState({
            isOpen: this.props.index === 0
        });
    },

    toggleSection() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    descriptionFromFeature(feature, clock) {
        // If a template is defined, render it using feature.properties, which is non-time-varying.
        // If no template is provided, show feature.description, which may be time-varying.
        const data = feature.properties;

        if (defined(this.props.template)) {
            return Mustache.render(this.props.template, data);
        }
        const description = feature.description.getValue(clock.currentTime);
        if (description.properties) {
            return JSON.stringify(description.properties);
        }
        return description;
    },

    renderDataTitle() {
        if(defined(this.props.catalogItemName)) {
            return this.props.catalogItemName;
        }
        return 'data group';
    },

    sanitizedCustomMarkdown() {
        const raw = this.descriptionFromFeature(this.props.feature, this.props.clock);
        const html = markdownToHtml(raw, false);
        return htmlToReactParser.parse(html);
    },

    render() {
        return (<li className={'feature-info-panel__section ' + (this.state.isOpen ? 'is-open' : '')}>
                    <button onClick={this.toggleSection} className={'btn feature-info-panel__title ' + (this.state.isOpen ? 'is-open' : '')}>{this.renderDataTitle()}</button>
                    <section className='feature-info-panel__content'>
                        {this.sanitizedCustomMarkdown()}
                    </section>
                </li>);
    }
});

// To do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
