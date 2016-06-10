'use strict';

import Mustache from 'mustache';
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import isArray from 'terriajs-cesium/Source/Core/isArray';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import classNames from 'classnames';


import formatNumberForLocale from '../../Core/formatNumberForLocale';
import ObserveModelMixin from '../ObserveModelMixin';
import propertyGetTimeValues from '../../Core/propertyGetTimeValues';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';
import FeatureInfoDownload from './FeatureInfoDownload';

import Styles from './feature-info-section.scss';

// We use Mustache templates inside React views, where React does the escaping; don't escape twice, or eg. " => &quot;
Mustache.escape = function(string) { return string; };

// Individual feature info section
const FeatureInfoSection = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        template: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string]),
        feature: React.PropTypes.object,
        position: React.PropTypes.object,
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
        const feature = this.props.feature;
        if (!this.isConstant()) {
            this.setState({
                clockSubscription: this.props.clock.onTick.addEventListener(function(clock) {
                    setCurrentFeatureValues(feature, clock);
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

    getTemplateData() {
        const propertyData = propertyValues(
            this.props.feature,
            this.props.clock,
            this.props.template && this.props.template.formats
        );

        let terriaData = {
            terria: {
                formatNumber: mustacheFormatNumberFunction
            }
        };
        if (this.props.position) {
            const latLngInRadians = Ellipsoid.WGS84.cartesianToCartographic(this.props.position);
            terriaData.terria = {
                coords: {
                    latitude: CesiumMath.toDegrees(latLngInRadians.latitude),
                    longitude: CesiumMath.toDegrees(latLngInRadians.longitude)
                }
            };
        }

        return Object.assign({}, propertyData || {}, terriaData);
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
        const templateData = this.getTemplateData();
        return typeof template === 'string' ?
            Mustache.render(template, templateData) :
            Mustache.render(template.template, templateData, template.partials);
    },

    descriptionFromFeature() {
        const feature = this.props.feature;
        // This description could contain injected <script> tags etc.
        // Before rendering, we will pass it through renderMarkdownInReact, which applies
        //     markdownToHtml (which applies MarkdownIt.render and DOMPurify.sanitize), and then
        //     parseCustomHtmlToReact (which calls htmlToReactParser).
        // Note that there is an unnecessary HTML encoding and decoding in this combination which would be good to remove.
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
        const catalogItemName = (this.props.catalogItem && this.props.catalogItem.name) || '';
        const fullName = (catalogItemName ? (catalogItemName + ' - ') : '') + this.renderDataTitle();
        const templateData = this.getTemplateData();

        return (
            <li className={classNames(Styles.section)}>
                <button type='button' onClick={this.clickHeader} className={classNames(Styles.title, {[Styles.btnIsOpen]: this.props.isOpen})}>
                    {fullName}
                </button>
                <If condition={this.props.isOpen}>
                    <section className={Styles.content}>
                        <If condition={this.hasTemplate()}>
                            {renderMarkdownInReact(this.descriptionFromTemplate(), this.props.catalogItem, this.props.feature)}
                            <button type="button" className={Styles.rawDataButton} onClick={this.toggleRawData}>
                                {this.state.showRawData ? 'Hide' : 'Show'} Raw Data
                            </button>
                        </If>

                        <If condition={!this.hasTemplate() || this.state.showRawData}>
                            {renderMarkdownInReact(this.descriptionFromFeature(), this.props.catalogItem, this.props.feature)}
                            <If condition={defined(templateData)}>
                                <FeatureInfoDownload key='download'
                                    viewState={this.props.viewState}
                                    data={templateData}
                                    name={catalogItemName} />
                            </If>
                        </If>
                    </section>
                </If>
            </li>
        );
    }
});

/**
 * Gets a map of property labels to property values for a feature at the provided clock's time.
 * @private
 * @param {Entity} feature a feature to get values for
 * @param {Clock} clock a clock to get the time from
 * @param {Object} [formats] A map of property labels to the number formats that should be applied for them.
 */
function propertyValues(feature, clock, formats) {
    // Manipulate the properties before templating them.
    // If they require .getValue, apply that.
    // If they have bad keys, fix them.
    // If they have formatting, apply it.
    const properties = feature.currentProperties || propertyGetTimeValues(feature.properties, clock);
    const result = replaceBadKeyCharacters(properties);
    if (defined(formats)) {
        applyFormatsInPlace(result, formats);
    }
    return result;
}

/**
 * Formats values in an object if their keys match the provided formats object.
 * @private
 * @param {Object} properties a map of property labels to property values.
 * @param {Object} formats A map of property labels to the number formats that should be applied for them.
 */
function applyFormatsInPlace(properties, formats) {
    // Optionally format each property. Updates properties in place, returning nothing.
    for (const key in formats) {
        if (properties.hasOwnProperty(key)) {
            properties[key] = formatNumberForLocale(properties[key], formats[key]);
        }
    }
}

/**
 * Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
 * @private
 */
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

/**
 * Determines whether all properties in the provided properties object have an isConstant flag set - otherwise they're
 * assumed to be time-varying.
 * @private
 * @returns {boolean}
 */
function areAllPropertiesConstant(properties) {
    // test this by assuming property is time-varying only if property.isConstant === false.
    // (so if it is undefined or true, it is constant.)
    let result = true;
    for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
            result = result && defined(properties[key]) && (properties[key].isConstant !== false);
        }
    }
    return result;
}

/**
 * Gets a text description for the provided feature at a certain time.
 * @private
 * @param {Entity} feature
 * @param {JulianDate} currentTime
 * @returns {String}
 */
function getCurrentDescription(feature, currentTime) {
    if (typeof feature.description.getValue === 'function') {
        return feature.description.getValue(currentTime);
    }
    return feature.description;
}

/**
 * Updates {@link Entity#currentProperties} and {@link Entity#currentDescription} with the values at the provided time.
 * @private
 * @param {Entity} feature
 * @param {JulianDate} currentTime
 */
function setCurrentFeatureValues(feature, clock) {
    const newProperties = propertyGetTimeValues(feature.properties, clock);
    if (newProperties !== feature.currentProperties) {
        feature.currentProperties = newProperties;
    }
    const newDescription = getCurrentDescription(feature, clock.currentTime);
    if (newDescription !== feature.currentDescription) {
        feature.currentDescription = newDescription;
    }
}

/**
 * Returns a function which implements number formatting in Mustache templates, using this syntax:
 * {{#terria.formatNumber}}{useGrouping: true}{{value}}{{/terria.formatNumber}}
 * @private
 */
function mustacheFormatNumberFunction() {
    return function(text, render) {
        // Eg. "{foo:1}hi there".match(optionReg) = ["{foo:1}hi there", "{foo:1}", "hi there"].
        // Note this won't work with nested objects in the options (but these aren't used yet).
        const optionReg = /^(\{[^}]+\})(.*)/;
        const components = text.match(optionReg);
        // This regex unfortunately matches double-braced text like {{number}}, so detect that separately and do not treat it as option json.
        const startsWithdoubleBraces = (text.length > 4) && (text[0] === '{') && (text[1] === '{');
        if (!components || startsWithdoubleBraces) {
            // If no options were provided, just use the defaults.
            return formatNumberForLocale(render(text));
        }
        // Allow {foo: 1} by converting it to {"foo": 1} for JSON.parse.
        const quoteReg = /([{,])(\s*)([A-Za-z0-9_\-]+?)\s*:/;
        const jsonOptions = components[1].replace(quoteReg, '$1"$3":');
        const options = JSON.parse(jsonOptions);
        return formatNumberForLocale(render(components[2]), options);
    };
}

module.exports = FeatureInfoSection;
