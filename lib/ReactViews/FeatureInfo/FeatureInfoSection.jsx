'use strict';

import Mustache from 'mustache';
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

// We use Mustache templates inside React views, where React does the escaping; don't escape twice, or eg. " => &quot;
// Mustache.escape = function(string) { return string; };

// Individual feature info section
const FeatureInfoSection = React.createClass({
    mixins: [ObserveModelMixin],
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
        // TODO: This description could contain injected <script> tags etc. We must sanitize it.
        // But do not escape it completely, because it also contains important html markup, eg. <table>.
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

    render() {
        const catalogItemName = (this.props.catalogItem && this.props.catalogItem.name) || '';
        return (
            <li className={'feature-info-panel__section ' + (this.props.isOpen ? 'is-open' : '')}>
                <button onClick={this.clickHeader} className={'btn feature-info-panel__title ' + (this.props.isOpen ? 'is-open' : '')}>{catalogItemName} - {this.renderDataTitle()}</button>
                {this.props.isOpen &&
                    <section className='feature-info-panel__content'>
                        {renderMarkdownInReact(this.descriptionFromFeature(this.props.feature, this.props.clock), this.props.catalogItem, this.props.feature)}
                    </section>
                }
            </li>
        );
    }
});

// To do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
