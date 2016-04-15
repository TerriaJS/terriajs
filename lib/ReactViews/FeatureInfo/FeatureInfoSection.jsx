'use strict';

import Mustache from 'mustache';
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import isArray from 'terriajs-cesium/Source/Core/isArray';
import classNames from 'classnames';

// import arraysAreEqual from '../../Core/arraysAreEqual';
import formatNumberForLocale from '../../Core/formatNumberForLocale';
import ObserveModelMixin from '../ObserveModelMixin';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';
import FeatureInfoDownload from './FeatureInfoDownload';

// We use Mustache templates inside React views, where React does the escaping; don't escape twice, or eg. " => &quot;
Mustache.escape = function(string) { return string; };

// Individual feature info section
const FeatureInfoSection = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        template: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string]),
        feature: React.PropTypes.object,
        clock: React.PropTypes.object,
        catalogItem: React.PropTypes.object,  // Note this may not be known (eg. WFS).
        isOpen: React.PropTypes.bool,
        onClickHeader: React.PropTypes.func
    },

    getInitialState() {
        return {
            clockSubscription: undefined,
            showRawData: false
        };
    },

    componentWillMount() {
        this.generateTemplateData();
    },

    componentWillReceiveProps() {
        this.generateTemplateData();
    },

    generateTemplateData() {
        this.setState({
            templateData: propertyValues(this.props.feature, this.props.clock, this.props.template && this.props.template.formats)
        });
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

    hasTemplate() {
        return this.props.template && (typeof this.props.template === 'string' || this.props.template.template);
    },

    descriptionFromTemplate() {
        const template = this.props.template;
        return typeof template === 'string' ?
            Mustache.render(template, this.state.templateData) :
            Mustache.render(template.template, this.state.templateData, template.partials);
    },

    descriptionFromFeature() {
        const feature = this.props.feature;

        // TODO: This description could contain injected <script> tags etc. We must sanitize it.
        // But do not escape it completely, because it also contains important html markup, eg. <table>.
        return feature.currentDescription || getCurrentDescription(feature, this.props.clock.currentTime);
    },

    renderDataTitle() {
        const feature = this.props.feature;
        const clock = this.props.clock;
        const template = this.props.template;
        if (typeof template === 'object' && defined(template.name)) {
            const context = propertyValues(feature, clock, template.formats);
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

    toggleRawData() {
        this.setState({
            showRawData: !this.state.showRawData
        });
    },

    render() {
        // console.log('render FeatureInfoSection', this.props.feature.name, this.props.clock.currentTime, getCurrentProperties(this.props.feature, this.props.clock.currentTime));
        const catalogItemName = (this.props.catalogItem && this.props.catalogItem.name) || '';
        return (
            <li className={classNames('feature-info-panel__section', {'is-open': this.props.isOpen})}>
                <button type='button' onClick={this.clickHeader}
                        className={classNames('btn', 'feature-info-panel__title', {'is-open': this.props.isOpen})}>
                    {catalogItemName} - {this.renderDataTitle()}
                </button>
                <If condition={this.props.isOpen}>
                    <section className='feature-info-panel__content'>
                        <If condition={this.hasTemplate()}>
                            {renderMarkdownInReact(this.descriptionFromTemplate(), this.props.catalogItem, this.props.feature)}
                            <button type="button" className="btn btn-primary feature-info-panel__raw-data-button" onClick={this.toggleRawData}>
                                {this.state.showRawData ? 'Hide' : 'Show'} Raw Data
                            </button>
                        </If>

                        <If condition={!this.hasTemplate() || this.state.showRawData}>
                            {renderMarkdownInReact(this.descriptionFromFeature(), this.props.catalogItem, this.props.feature)}

                            <FeatureInfoDownload key='download'
                                                 viewState={this.props.viewState}
                                                 data={this.state.templateData}
                                                 name={catalogItemName}/>

                        </If>
                    </section>
                </If>
            </li>
        );
    }
});


function propertyValues(feature, clock, formats) {
    // Manipulate the properties before templating them.
    // If they require .getValue, apply that.
    // If they have bad keys, fix them.
    // If they have formatting, apply it.
    const properties = feature.currentProperties || getCurrentProperties(feature, clock.currentTime);
    const result = replaceBadKeyCharacters(properties);
    if (defined(formats)) {
        applyFormatsInPlace(result, formats);
    }
    return result;
}

function applyFormatsInPlace(properties, formats) {
    // Optionally format each property. Updates properties in place, returning nothing.
    for (const key in formats) {
        if (properties.hasOwnProperty(key)) {
            properties[key] = formatNumberForLocale(properties[key], formats[key]);
        }
    }
}

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
