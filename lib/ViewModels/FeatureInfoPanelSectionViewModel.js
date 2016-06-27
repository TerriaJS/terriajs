'use strict';

/*global require*/
var Mustache = require('mustache');

var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var isArray = require('terriajs-cesium/Source/Core/isArray');
var FeatureDetection = require('terriajs-cesium/Source/Core/FeatureDetection');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');

var formatNumberForLocale = require('../Core/formatNumberForLocale');
var loadView = require('../Core/loadView');
var TerriaError = require('../Core/TerriaError');
var propertyGetTimeValues = require('../Core/propertyGetTimeValues');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var svgDownload = require('../SvgPaths/svgDownload2');

var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

// Unfortunately there's no way to feature-detect for this, it's something that only MS browsers disallow for security reasons.
var CAN_USE_DATA_URI_IN_HREF = !(FeatureDetection.isInternetExplorer() || /Edge/.exec(navigator.userAgent));

/**
 * A ViewModel of a Feature Info Panel Section.
 * Contains a single feature for display within the feature info panel.
 * @alias FeatureInfoPanelSectionViewModel
 * @constructor
 *
 * @param {FeatureInfoPanelViewModel} [featureInfoPanelViewModel] The FeatureInfoPanelViewModel instance
 * @param {Cesium.Entity} feature The feature to display.
*/
var FeatureInfoPanelSectionViewModel = function(featureInfoPanelViewModel, feature, catalogItem) {
    this.terria = featureInfoPanelViewModel.terria;
    this.featureInfoPanelViewModel = featureInfoPanelViewModel;
    this._clockSubscription = undefined;
    this.feature = feature;
    this.template = undefined;
    this.partials = undefined;
    this.formats = undefined;
    this.name = undefined;

    var template = defined(catalogItem) ? catalogItem.featureInfoTemplate : undefined;
    var nameTemplate;
    if (defined(template)) {
        // template may be a string, eg. '<div>{{{Foo}}} Hello {{name}}</div>'.
        if (typeof template === 'string') {
            this.template = template;
        } else {
            // Or, template may be an object with 'name', 'template', 'formats', and/or 'partials' keys.
            // Eg. {name: '{{Bar}}', template: '<div>test {{>foobar}}</div>', partials: {foobar: '<b>{{Foo}}</b>'} }
            this.template = template.template;
            this.partials = template.partials;
            this.formats = template.formats;
            nameTemplate = template.name;
        }
    }

    var data = propertyValues(feature.properties, this.formats, this.terria.clock, this.terria.pickedFeatures);

    if (nameTemplate) {
        this.name = Mustache.render(nameTemplate, data);
    } else {
        this.name = feature.name ? feature.name : '';
    }

    this._updateContent(data);

    this.catalogItemName = defined(catalogItem) ? catalogItem.name : '';
    configureHtmlUpdater(this);

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;
    this.svgDownload = svgDownload;

    /** Whether the raw data table should be shown */
    this.rawDataVisible = false; // raw data should be hidden on init unless there's no template

    /** What links are available for data download. Generally JSON and CSV are available, but only JSON is available
     * if the data can't be represented as a CSV. */
    if (defined(data) && Object.keys(data).length) {
        delete data.terria; // don't want this wrecking the CSV
        delete data._terria_columnAliases; // or this.
        this.dataDownloads = [
            {
                href: makeDataUri('csv', generateCsvData(data)),
                ext: 'csv',
                name: 'CSV'
            },
            {
                href: makeDataUri('json', JSON.stringify(data)),
                ext: 'json',
                name: 'JSON'
            }
        ].filter(function(download) {
            return defined(download.href);
        });
    } else {
        this.dataDownloads = [];
    }

    /** Whether other download options (the dropdown below the first option) should be visible */
    this.downloadOptionsVisible = false;
    /** The position of the download options dropdown - as this needs to cover the edge of a potentially scrolling modal,
     * it is set to position: fixed and its position is changed to match that of its parent whenever it's opened.
     */
    this.downloadDropdownPosition = undefined;
    this._resetDownloadDropdownPosition();

    /** {@see CAN_USE_DATA_URI_IN_HREF} - made settable for testing */
    this.canUseDataUriInHref = CAN_USE_DATA_URI_IN_HREF;

    knockout.track(this, ['name', 'templatedInfo', 'rawData', 'catalogItemName', 'rawDataVisible', 'downloadOptionsVisible', 'downloadDropdownPosition']);

    // Use a white background when displaying complete HTML documents rather than just snippets.
    knockout.defineProperty(this, 'useWhiteBackground', {
        get: function() {
            return htmlTagRegex.test(this.rawData);
        }
    });
};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
FeatureInfoPanelSectionViewModel.prototype.show = function(container) {
    loadView(require('../Views/FeatureInfoPanelSection.html'), container, this);
};

FeatureInfoPanelSectionViewModel.prototype.destroy = function() {
    // unsubscribe to any clock subscription
    if (defined(this._clockSubscription)) {
        // remove the event listener
        this._clockSubscription();
        this._clockSubscription = undefined;
    }
    // to be consistent with other destroy methods (probably unnecessary)
    destroyObject(this);
};

FeatureInfoPanelSectionViewModel.prototype.toggleOpen = function() {
    if (this.terria.selectedFeature === this.feature) {
        this.terria.selectedFeature = undefined;
    } else {
        this.terria.selectedFeature = this.feature;
    }

    // ensure the targeting cursor keeps updating (as it is hooked into the Cesium render loop)
    this.terria.currentViewer.notifyRepaintRequired();
};

FeatureInfoPanelSectionViewModel.prototype._updateContent = function(data) {
    if (defined(this.template)) {
        this.templatedInfo = Mustache.render(this.template, data, this.partials);
    }
    if (defined(this.feature.description)) {
        this.rawData = this.feature.description.getValue(this.terria.clock.currentTime);
    } else if (defined(data)) {
        // There is no template, and no description - just return the properties as JSON.
        this.rawData = JSON.stringify(data);
    }
    // TODO: Replace custom components (eg. <chart>) with spans with unique ids, using the browser's DOM to parse the html,
    // and update the featureInfoPanelSectionViewModel's info.
};

FeatureInfoPanelSectionViewModel.prototype.showRawData = function() {
    this.rawDataVisible = true;
};

FeatureInfoPanelSectionViewModel.prototype.hideRawData = function() {
    this.rawDataVisible = false;
};

/** Event listener that toggles whether download options other than the first one (i.e. the dropdown part of the downloads
 * dropdown) should be visible. If it's becoming visible, does the work to update the location of the dropdown.
 */
FeatureInfoPanelSectionViewModel.prototype.toggleDownloadOptions = function(viewModel, event) {
    if (this.downloadOptionsVisible) {
        this._resetDownloadDropdownPosition();
    } else {
        var outerDropdownContainer = event.currentTarget.parentNode.parentNode;
        var outerDropdownPosition = outerDropdownContainer.getBoundingClientRect();

        this.downloadDropdownPosition = {
            top: outerDropdownPosition.top + 'px',
            left: outerDropdownPosition.left + 'px',
            width: (outerDropdownPosition.right - outerDropdownPosition.left) + 'px'
        };

        // Listener that hides the dropdown and removes itself from everything it's listening to.
        var hideOptions = function() {
            this.downloadOptionsVisible = false;
            document.body.removeEventListener('click', hideOptions);
            document.querySelector('#feature-info-panel-sections').removeEventListener('scroll', hideOptions);
        }.bind(this);

        // Add the listener to be triggered when a click happens anywhere on the body (including the toggle button)
        // or the outer panel is scrolled.
        document.body.addEventListener('click', hideOptions);
        document.querySelector('#feature-info-panel-sections').addEventListener('scroll', hideOptions);

        event.stopPropagation(); // we don't want the listener to be triggered by this click event once it bubbles to the body.
    }

    // Do this last so that the code above can get the right position.
    this.downloadOptionsVisible = !this.downloadOptionsVisible;
};

/**
 * Event listener attached to data uri links - checks that they're actually supported by the user's browser. If so, lets
 * them through, otherwise swallows the event and presents an error message explaining why it won't work.
 */
FeatureInfoPanelSectionViewModel.prototype.checkDataUriCompatibility = function(viewModel, event) {
    if (!this.canUseDataUriInHref) {
        var href = event.currentTarget.getAttribute('href');

        this.terria.error.raiseEvent(new TerriaError({
            title: 'Browser Does Not Support Data Download',
            message: 'Unfortunately Microsoft browsers (including all versions of Internet Explorer and Edge) do not ' +
                'support the data uri functionality needed to download data as a file. To download, copy the following uri ' +
                'into another browser such as Chrome, Firefox or Safari: ' + href
        }));
    } else {
        return true; // allow the event.
    }
};

FeatureInfoPanelSectionViewModel.prototype._resetDownloadDropdownPosition = function() {
    this.downloadDropdownPosition = {
        top: 'inherit',
        left: 'inherit',
        width: 'inherit'
    };
};

/**
 * Turns a 2-dimensional javascript object into a CSV string, with the first row being the property names and the second
 * row being the data. If the object is too hierarchical to be made into a CSV, returns undefined.
 */
function generateCsvData(data) {
    if (!defined(data)) {
        return;
    }
    var row1 = [];
    var row2 = [];

    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var type = typeof data[key];

        // If data is too hierarchical to fit in a table, just return undefined as we can't generate a CSV.
        if (type === 'object' && data[key] !== null) { //covers both objects and arrays.
            return;
        }
        if (type === 'function') {
            // Ignore template functions we may add.
            continue;
        }

        row1.push(makeSafeForCsv(key));
        row2.push(makeSafeForCsv(data[key]));
    }

    return row1.join(',') + '\n' + row2.join(',');
}

function makeSafeForCsv(value) {
    value = '' + defaultValue(value, '');

    return '"' + value.replace(/"/g, '""') + '"';
}

/**
 * Turns a file with the supplied type and stringified data into a data uri that can be set as the href of an anchor tag.
 */
function makeDataUri(type, dataString) {
    if (dataString) {
        // Using attachment/* mime type makes safari download as attachment.
        return 'data:attachment/' + type + ',' + encodeURIComponent(dataString);
    }
}

// Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
function replaceBadKeyCharacters(properties) {
    // if properties is anything other than an Object type, return it. Otherwise recurse through its properties.
    if (!properties || typeof properties !== 'object' || isArray(properties)) {
        return properties;
    }
    var result = {};
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            var cleanKey = key.replace(/[.#]/g, '_');
            result[cleanKey] = replaceBadKeyCharacters(properties[key]);
        }
    }
    return result;
}

function applyFormatsInPlace(properties, formats) {
    // Optionally format each property. Updates properties in place, returning nothing.
    for (var key in formats) {
        if (properties.hasOwnProperty(key)) {
            properties[key] = formatNumberForLocale(properties[key], formats[key]);
        }
    }
}

function propertyValues(properties, formats, clock, pickedFeatures) {
    // Manipulate the properties before templating them.
    // If they require .getValue, apply that.
    // If they have bad keys, fix them.
    // If they have formatting, apply it.
    // Add in the picked lat & lon.
    var result = propertyGetTimeValues(properties, clock);
    // If property names were changed, let the template access the original property names too.
    if (defined(result) && defined(result._terria_columnAliases)) {
        for (var i = 0; i < result._terria_columnAliases.length; i++) {
            var alias = result._terria_columnAliases[i];
            result[alias.id] = result[alias.name];
        }
    }
    result = replaceBadKeyCharacters(result);
    if (defined(formats)) {
        applyFormatsInPlace(result, formats);
    }
    var position = pickedFeatures && pickedFeatures.pickPosition;

    result.terria = {
        // Implements number formatting using this syntax:
        // {{#terria.formatNumber}}{useGrouping: true}{{value}}{{/terria.formatNumber}}
        formatNumber: mustacheFormatNumberFunction
    };
    if (defined(position)) {
        var latLngInRadians = Ellipsoid.WGS84.cartesianToCartographic(position);
        if (!defined(result)) {
            result = {};
        }
        result.terria.coords = {
            latitude: CesiumMath.toDegrees(latLngInRadians.latitude),
            longitude: CesiumMath.toDegrees(latLngInRadians.longitude)
        };
    }

    return result;
}

function mustacheFormatNumberFunction() {
    return function(text, render) {
        // Eg. "{foo:1}hi there".match(optionReg) = ["{foo:1}hi there", "{foo:1}", "hi there"].
        // Note this won't work with nested objects in the options (but these aren't used yet).
        var optionReg = /^(\{[^}]+\})(.*)/;
        var components = text.match(optionReg);
        // This regex unfortunately matches double-braced text like {{number}}, so detect that separately and do not treat it as option json.
        var startsWithdoubleBraces = (text.length > 4) && (text[0] === '{') && (text[1] === '{');
        if (!components || startsWithdoubleBraces) {
            // If no options were provided, just use the defaults.
            return formatNumberForLocale(render(text));
        }
        // Allow {foo: 1} by converting it to {"foo": 1} for JSON.parse.
        var quoteReg = /([{,])(\s*)([A-Za-z0-9_\-]+?)\s*:/;
        var jsonOptions = components[1].replace(quoteReg, '$1"$3":');
        var options = JSON.parse(jsonOptions);
        return formatNumberForLocale(render(components[2]), options);
    };
}

function addInfoUpdater(viewModel) {
    // the return value of addEventListener is a function which removes the event listener
    viewModel._clockSubscription = viewModel.terria.clock.onTick.addEventListener(function(clock) {
        viewModel._updateContent(propertyValues(viewModel.feature.properties, viewModel.formats, viewModel.terria.clock, viewModel.terria.pickedFeatures));
    });
}

function areAllPropertiesConstant(properties) {
    // test this by assuming property is time-varying only if property.isConstant === false.
    // (so if it is undefined or true, it is constant.)
    var result = true;
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            result = result && defined(properties[key]) && (properties[key].isConstant !== false);
        }
    }
    return result;
}

function configureHtmlUpdater(viewModel) {
    // The info is constant if:
    // No template is provided, and feature.description is defined and constant,
    // OR
    // A template is provided and all feature.properties are constant.
    // If info is NOT constant, we need to keep updating the description.
    var isConstant = !defined(viewModel.template) && defined(viewModel.feature.description) && viewModel.feature.description.isConstant;
    isConstant = isConstant || (defined(viewModel.template) && areAllPropertiesConstant(viewModel.feature.properties));
    if (!isConstant) {
        addInfoUpdater(viewModel);
    }
}

module.exports = FeatureInfoPanelSectionViewModel;
