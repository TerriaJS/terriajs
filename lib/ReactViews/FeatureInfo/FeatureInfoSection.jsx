'use strict';

import Mustache from 'mustache';
import React from 'react';

import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import classNames from 'classnames';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import isArray from 'terriajs-cesium/Source/Core/isArray';

import FeatureInfoDownload from './FeatureInfoDownload';
import formatNumberForLocale from '../../Core/formatNumberForLocale';
import ObserveModelMixin from '../ObserveModelMixin';
import propertyGetTimeValues from '../../Core/propertyGetTimeValues';
import CustomComponents from '../../Models/CustomComponents';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';
import Icon from "../Icon.jsx";

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
            timeoutId: undefined,
            showRawData: false
        };
    },

    componentWillMount() {
        const that = this;
        const feature = this.props.feature;
        // If the feature description or properties update over time, we need to update when they change.
        if (!this.isConstant()) {
            this.setState({
                clockSubscription: this.props.clock.onTick.addEventListener(function(clock) {
                    setCurrentFeatureValues(feature, clock);
                })
            });
        }
        // There's another situation that requires updating: when a custom component auto-updates.
        // TODO: Currently we only check for this on mount, so if it changes over time, won't pick it up.
        // (The clockSubscription above happens every tick, so don't test there! Ideally would test only on update.)
        setTimeoutForUpdatingCustomComponents(that);
    },

    componentWillUnmount() {
        if (defined(this.state.clockSubscription)) {
            // Remove the event listener.
            this.state.clockSubscription();
        }
        if (defined(this.state.timeoutId)) {
            clearTimeout(this.state.timeoutId);
        }
    },

    getPropertyValues() {
        return getPropertyValuesForFeature(this.props.feature, this.props.clock, this.props.template && this.props.template.formats);
    },

    getTemplateData() {
        const propertyData = this.getPropertyValues();
        if (defined(propertyData)) {

            propertyData.terria = {
                formatNumber: mustacheFormatNumberFunction
            };
            if (this.props.position) {
                const latLngInRadians = Ellipsoid.WGS84.cartesianToCartographic(this.props.position);
                propertyData.terria.coords = {
                    latitude: CesiumMath.toDegrees(latLngInRadians.latitude),
                    longitude: CesiumMath.toDegrees(latLngInRadians.longitude)
                };
            }
        }
        return propertyData;
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
        let description = feature.currentDescription || getCurrentDescription(feature, this.props.clock.currentTime);
        if (!defined(description) && defined(feature.properties)) {
            description = describeFromProperties(feature.properties, this.props.clock.currentTime);
        }
        return description;
    },

    renderDataTitle() {
        const template = this.props.template;
        if (typeof template === 'object' && defined(template.name)) {
            return Mustache.render(template.name, this.getPropertyValues());
        }
        const feature = this.props.feature;
        return (feature && feature.name) || '';
    },

    isConstant() {
        // The info is constant if:
        // 1. There is no info (ie. no description and no properties).
        // 2. A template is provided and all feature.properties are constant.
        // OR
        // 3. No template is provided, and feature.description is either not defined, or defined and constant.
        // If info is NOT constant, we need to keep updating the description.
        const feature = this.props.feature;
        if (!defined(feature.description) && !defined(feature.properties)) {
            return true;
        }
        if (defined(this.props.template)) {
            return areAllPropertiesConstant(feature.properties);
        }
        if (defined(feature.description)) {
            return feature.description.isConstant; // This should always be a "Property" eg. a ConstantProperty.
        }
        return true;
    },

    toggleRawData() {
        this.setState({
            showRawData: !this.state.showRawData
        });
    },

    render() {
        const catalogItemName = (this.props.catalogItem && this.props.catalogItem.name) || '';
        const fullName = (catalogItemName ? (catalogItemName + ' - ') : '') + this.renderDataTitle();
        const reactInfo = getInfoAsReactComponent(this);

        return (
            <li className={classNames(Styles.section)}>
                <button type='button' onClick={this.clickHeader} className={Styles.title}>
                    {fullName}
                    {this.props.isOpen ? <Icon glyph={Icon.GLYPHS.opened}/> : <Icon glyph={Icon.GLYPHS.closed}/>}
                </button>
                <If condition={this.props.isOpen}>
                    <section className={Styles.content}>
                        <If condition={this.hasTemplate()}>
                            {reactInfo.info}
                            <button type="button" className={Styles.rawDataButton} onClick={this.toggleRawData}>
                                {this.state.showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
                            </button>
                        </If>

                        <If condition={reactInfo.showRawData}>
                            <If condition={reactInfo.hasRawData}>
                                {reactInfo.rawData}
                            </If>
                            <If condition={!reactInfo.hasRawData}>
                                <div ref="no-info" key="no-info">No information available.</div>
                            </If>
                            <If condition={defined(reactInfo.templateData)}>
                                <FeatureInfoDownload key='download'
                                    viewState={this.props.viewState}
                                    data={reactInfo.templateData}
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
 * @param {Entity} feature A feature to get values for.
 * @param {Clock} clock A clock to get the time from.
 * @param {Object} [formats] A map of property labels to the number formats that should be applied for them.
 */
function getPropertyValuesForFeature(feature, clock, formats) {
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
    if (defined(properties.isConstant)) {
        return properties.isConstant;
    }
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
    if (feature.description && typeof feature.description.getValue === 'function') {
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
        // Note I use [\s\S]* instead of .* at the end - .* does not match newlines, [\s\S]* does.
        const optionReg = /^(\{[^}]+\})([\s\S]*)/;
        const components = text.match(optionReg);
        // This regex unfortunately matches double-braced text like {{number}}, so detect that separately and do not treat it as option json.
        const startsWithdoubleBraces = (text.length > 4) && (text[0] === '{') && (text[1] === '{');
        if (!components || startsWithdoubleBraces) {
            // If no options were provided, just use the defaults.
            return formatNumberForLocale(render(text));
        }
        // Allow {foo: 1} by converting it to {"foo": 1} for JSON.parse.
        const quoteReg = /([{,])(\s*)([A-Za-z0-9_\-]+?)\s*:/g;
        const jsonOptions = components[1].replace(quoteReg, '$1"$3":');
        const options = JSON.parse(jsonOptions);
        return formatNumberForLocale(render(components[2]), options);
    };
}

const simpleStyleIdentifiers = ['title', 'description',
    'marker-size', 'marker-symbol', 'marker-color', 'stroke',
    'stroke-opacity', 'stroke-width', 'fill', 'fill-opacity'];

/**
 * A way to produce a description if properties are available but no template is given.
 * Derived from Cesium's geoJsonDataSource, but made to work with possibly time-varying properties.
 * @private
 */
function describeFromProperties(properties, time) {
    let html = '';
    for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
            if (simpleStyleIdentifiers.indexOf(key) !== -1) {
                continue;
            }
            let value = properties[key];
            if (defined(value)) {
                if (defined(value.getValue)) {
                    value = value.getValue(time);
                }
                if (Array.isArray(properties)) {
                    html += '<tr><td>' + describeFromProperties(value, time) + '</td></tr>';
                } else if (typeof value === 'object') {
                    html += '<tr><th>' + key + '</th><td>' + describeFromProperties(value, time) + '</td></tr>';
                } else {
                    html += '<tr><th>' + key + '</th><td>' + value + '</td></tr>';
                }
            }
        }
    }
    if (html.length > 0) {
        html = '<table class="cesium-infoBox-defaultTable"><tbody>' + html + '</tbody></table>';
    }
    return html;
}

function getArrayMinimum(numberArray) {  // eslint-disable-line require-jsdoc
    return Math.min.apply(null, numberArray.filter(x => defined(x)));
}

/**
 * @param  {ReactClass} that The FeatureInfoSection.
 * @return {Object} Returns {templateData, info, rawData, showRawData, hasRawData}.
 *                  templateData is the object passed to the templating engine.
 *                  info is the main body of the info section, as a react component.
 *                  rawData is the same for the raw data, if it needs to be shown.
 *                  showRawData is whether to show the rawData.
 *                  hasRawData is whether there is any rawData to show.
 */
function getInfoAsReactComponent(that) {
    const templateData = that.getPropertyValues();
    let updateCounter;
    if (defined(templateData)) {
        updateCounter = templateData._terria_updateCounter || 0;
        delete templateData._terria_columnAliases;
        delete templateData._terria_updateCounter;
    }
    const context = {
        catalogItem: that.props.catalogItem,
        feature: that.props.feature,
        updateCounter: updateCounter
    };
    const showRawData = !that.hasTemplate() || that.state.showRawData;
    let rawDataHtml;
    let rawData;
    if (showRawData) {
        rawDataHtml = that.descriptionFromFeature();
        if (defined(rawDataHtml)) {
            rawData = renderMarkdownInReact(rawDataHtml, context);
        }
    }
    return {
        templateData: templateData,
        info: that.hasTemplate() ? renderMarkdownInReact(that.descriptionFromTemplate(), context) : rawData,
        rawData: rawData,
        showRawData: showRawData,
        hasRawData: !!rawDataHtml
    };
}

function setTimeoutForUpdatingCustomComponents(that) {  // eslint-disable-line require-jsdoc
    const {info} = getInfoAsReactComponent(that);
    const customComponents = CustomComponents.find(info);
    const updateTimes = customComponents.map(match => match.type.selfUpdateSeconds(match.reactComponent));
    const minUpdateTime = getArrayMinimum(updateTimes);
    console.log('update times', updateTimes, minUpdateTime);
    if (defined(that.state.timeoutId)) {
        clearTimeout(that.state.timeoutId);
    }
    if (minUpdateTime > 0) {
        that.setState({
            timeoutId: setTimeout(() => {
                console.log('triggering update', that.props.feature);
                // These lines simply increment _terria_updateCounter by 1, handling various initially undefined cases.
                if (!defined(that.props.feature.currentProperties)) {
                    that.props.feature.currentProperties = {
                        _terria_updateCounter: 1  // eslint-disable-line camelcase
                    };
                } else if (!defined(that.props.feature.currentProperties._terria_updateCounter)) {
                    that.props.feature.currentProperties._terria_updateCounter = 1;  // eslint-disable-line camelcase
                } else {
                    that.props.feature.currentProperties._terria_updateCounter++;
                }
                // And finish by triggering the next timeout, but do this in another timeout so we aren't nesting setStates.
                setTimeout(() => {
                    setTimeoutForUpdatingCustomComponents(that);
                }, 5);
            }, minUpdateTime)
        });
    }
}

module.exports = FeatureInfoSection;
