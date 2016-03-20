'use strict';

import Mustache from 'mustache';
import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import CustomComponents from '../../Models/CustomComponents';
import markdownToHtml from '../../Core/markdownToHtml';
import parseCustomHtmlToReact from '../../Models/parseCustomHtmlToReact';

// Individual feature info section
const FeatureInfoSection = React.createClass({
    propTypes: {
        template: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string]),
        feature: React.PropTypes.object,
        clock: React.PropTypes.object,
        catalogItem: React.PropTypes.object,
        isOpen: React.PropTypes.bool,
        onClickHeader: React.PropTypes.func
    },

    clickHeader() {
        if (defined(this.props.onClickHeader)) {
            this.props.onClickHeader(this.props.feature);
        }
    },

    descriptionFromFeature(feature, clock) {
        // If a template is defined, render it using feature.properties, which is non-time-varying.
        // If no template is provided, show feature.description, which may be time-varying.
        const data = feature.properties;
        const template = this.props.template;
        if (defined(template)) {
            if (typeof template === 'string') {
                return Mustache.render(template, data);
            }
            return Mustache.render(template.template, data, template.partials);
        }
        const description = feature.description.getValue(clock.currentTime);
        if (description.properties) {
            return JSON.stringify(description.properties);
        }
        return description;
    },

    renderDataTitle() {
        const template = this.props.template;
        if (typeof template === 'object' && defined(template.name)) {
            const data = this.props.feature.properties;
            return Mustache.render(template.name, data);
        }

        return (this.props.feature && this.props.feature.name) || '';
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
        const catalogItemName = (this.props.catalogItem && this.props.catalogItem.name) || '';
        return (
            <li className={'feature-info-panel__section ' + (this.props.isOpen ? 'is-open' : '')}>
                <button onClick={this.clickHeader} className={'btn feature-info-panel__title ' + (this.props.isOpen ? 'is-open' : '')}>{catalogItemName} - {this.renderDataTitle()}</button>
                {this.props.isOpen &&
                    <section className='feature-info-panel__content'>
                        {this.sanitizedCustomMarkdown()}
                    </section>
                }
            </li>
        );
    }
});

// To do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
