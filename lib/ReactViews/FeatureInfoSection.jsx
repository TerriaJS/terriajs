'use strict';

import Mustache from 'mustache';
import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import CustomComponents from '../Models/CustomComponents';
import markdownToHtml from '../Core/markdownToHtml';
import parseCustomHtmlToReact from '../Models/parseCustomHtmlToReact';

// Individual feature info section
const FeatureInfoSection = React.createClass({
    propTypes: {
        template: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string]),
        feature: React.PropTypes.object,
        clock: React.PropTypes.object,
        catalogItem: React.PropTypes.object,
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
        if(defined(this.props.catalogItem.name)) {
            return this.props.catalogItem.name;
        }
        return 'data group';
    },

    sanitizedCustomMarkdown() {
        const raw = this.descriptionFromFeature(this.props.feature, this.props.clock);
        const html = markdownToHtml(raw, false, {
            ADD_TAGS: CustomComponents.names(),
            ADD_ATTR: CustomComponents.attributes()
        });
        return parseCustomHtmlToReact('<div>' + html + '</div>', this.props.catalogItem, this.props.feature);
    },

    render() {
        return (
            <li className={'feature-info-panel__section ' + (this.state.isOpen ? 'is-open' : '')}>
                <button onClick={this.toggleSection} className={'btn feature-info-panel__title ' + (this.state.isOpen ? 'is-open' : '')}>{this.renderDataTitle()}</button>
                <section className='feature-info-panel__content'>
                    {this.sanitizedCustomMarkdown()}
                </section>
            </li>
        );
    }
});

// To do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
