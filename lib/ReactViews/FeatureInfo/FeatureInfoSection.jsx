'use strict';

import Mustache from 'mustache';
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

// We use Mustache templates inside React views, where React does the escaping; don't escape twice, or eg. " => &quot;
Mustache.escape = function(string) { return string; };

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

    getInitialState() {
        return {
            clockSubscription: undefined
        };
    },

    componentDidMount() {
        const feature = this.props.feature;
        if (!this.isConstant()) {
            this.setState({
                clockSubscription: this.props.clock.onTick.addEventListener(function(clock) {
                    setCurrentFeatureValues(feature, clock.currentTime);
                })
            });
        }
        setCurrentFeatureValues(feature, this.props.clock.currentTime);
    },

    componentWillUnmount() {
        if (defined(this.state.clockSubscription)) {
            // Remove the event listener.
            this.state.clockSubscription();
        }
    },

    clickHeader() {
        if (defined(this.props.onClickHeader)) {
            this.props.onClickHeader(this.props.feature);
        }
    },

    descriptionFromFeature(feature, clock) {
        const data = feature.currentProperties;
        const template = this.props.template;
        if (defined(template)) {
            if (typeof template === 'string') {
                return Mustache.render(template, data);
            }
            return Mustache.render(template.template, data, template.partials);
        }
        const description = feature.currentDescription;
        // if (description && description.properties) {
        //     return JSON.stringify(description.properties);
        // }
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

    isConstant() {
        // The info is constant if:
        // No template is provided, and feature.description is defined and constant,
        // OR
        // A template is provided and all feature.properties are constant.
        // If info is NOT constant, we need to keep updating the description.
        const feature = this.props.feature;
        const template = this.props.template;
        let isConstant = !defined(template) && defined(feature.description) && feature.description.isConstant;
        isConstant = isConstant || (defined(template) && areAllPropertiesConstant(feature.properties));
        return isConstant;
    },

    render() {
        const catalogItemName = (this.props.catalogItem && this.props.catalogItem.name) || '';
        return (
            <li className={'feature-info-panel__section ' + (this.props.isOpen ? 'is-open' : '')}>
                <button type='button' onClick={this.clickHeader} className={'btn feature-info-panel__title ' + (this.props.isOpen ? 'is-open' : '')}>{catalogItemName} - {this.renderDataTitle()}</button>
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
function areAllPropertiesConstant(properties) {
    // test this by assuming property is time-varying only if property.isConstant === false.
    // (so if it is undefined or true, it is constant.)
    let result = true;
    for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
            result = result && properties[key] && (properties[key].isConstant !== false);
        }
    }
    return result;
}

function setCurrentFeatureValues(feature, currentTime) {
    if (typeof feature.properties.getValue === 'function') {
        feature.currentProperties = feature.properties.getValue(currentTime);
    } else {
        feature.currentProperties = feature.properties;
    }
    if (typeof feature.description.getValue === 'function') {
        feature.currentDescription = feature.description.getValue(currentTime);
    } else {
        feature.currentDescription = feature.description;
    }
}

module.exports = FeatureInfoSection;
