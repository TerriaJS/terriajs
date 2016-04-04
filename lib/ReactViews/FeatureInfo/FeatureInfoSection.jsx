'use strict';

import Mustache from 'mustache';
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import isArray from 'terriajs-cesium/Source/Core/isArray';

// import arraysAreEqual from '../../Core/arraysAreEqual';
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
        const template = this.props.template;
        if (defined(template)) {
            const properties = feature.currentProperties || getCurrentProperties(feature, clock.currentTime);
            const context = replaceBadKeyCharacters(properties);
            if (typeof template === 'string') {
                return Mustache.render(template, context);
            }
            return Mustache.render(template.template, context, template.partials);
        }
        const description = feature.currentDescription || getCurrentDescription(feature, clock.currentTime);
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
            const properties = this.props.feature.properties;
            const context = replaceBadKeyCharacters(properties);
            return Mustache.render(template.name, context);
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
        // console.log('render FeatureInfoSection', this.props.feature.name, this.props.clock.currentTime, getCurrentProperties(this.props.feature, this.props.clock.currentTime));
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

// Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
function replaceBadKeyCharacters(properties) {
    // if properties is anything other than an Object type, return it. Otherwise recurse through its properties.
    if (!properties || typeof properties !== 'object' || isArray(properties)) {
        return properties;
    }
    const result = {};
    for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
            const cleanKey = key.replace(/[.#]/g, '_');
            result[cleanKey] = replaceBadKeyCharacters(properties[key]);
        }
    }
    return result;
}

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

// Because x.getValue() returns the same object if it has not changed, we don't need this.
// function newObjectOnlyIfChanged(oldObject, newObject) {
//     // Does a shallow compare, and returns the old object if there is no change, otherwise the new object.
//     if (defined(oldObject) && defined(newObject) && arraysAreEqual(Object.keys(oldObject), Object.keys(newObject))) {
//         for (const key in newObject) {
//             if (newObject.hasOwnProperty(key)) {
//                 if (oldObject[key] !== newObject[key]) {
//                     return newObject;
//                 }
//             }
//         }
//         return oldObject;
//     }
//     // If the keys have changed, then just use the new object.
//     return newObject;
// }

function getCurrentProperties(feature, currentTime) {
    // Use this instead of the straight feature.currentProperties, so it works the first time through.
    if (typeof feature.properties.getValue === 'function') {
        return feature.properties.getValue(currentTime);
    }
    return feature.properties;
}

function getCurrentDescription(feature, currentTime) {
    if (typeof feature.description.getValue === 'function') {
        return feature.description.getValue(currentTime);
    }
    return feature.description;
}

function setCurrentFeatureValues(feature, currentTime) {
    const newProperties = getCurrentProperties(feature, currentTime);
    if (newProperties !== feature.currentProperties) {
        feature.currentProperties = newProperties;
    }
    const newDescription = getCurrentDescription(feature, currentTime);
    if (newDescription !== feature.currentDescription) {
        feature.currentDescription = newDescription;
    }
}

module.exports = FeatureInfoSection;
