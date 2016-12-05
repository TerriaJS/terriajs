'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var ShortReportSection = require('./ShortReportSection');

/**
 * A catalog item representing the result of invoking the elevation function.
 *
 * @alias ElevationCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
function ElevationCatalogItem(terria) {
    this._geoJsonItem = undefined;

    /**
     * Gets or sets the parameters to the WPS function.
     * All parameter names must be entered in lowercase in order to be consistent with references in TerrisJS code.
     * @type {FunctionParameter[]}
     */
    this.parameters = undefined;

    /**
     * Gets or sets the result of calling the elevation function for elevation.
     * @type {Object}
     */
    this.elevationResult = undefined;

    /**
     * Gets or sets the result of calling the elevation function for water table.
     * @type {Object}
     */
    this.waterResult = undefined;

    /**
     * Name of chart to create
     * @type {Object}
     */
    this.chartName = undefined;

    CatalogItem.call(this, terria);
}

inherit(CatalogItem, ElevationCatalogItem);

defineProperties(ElevationCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ElevationCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'elevation-result';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Elevation Result'.
     * @memberOf ElevationCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Elevation Result';
        }
    },

    /**
     * Gets the data source associated with this catalog item.
     * @memberOf ElevationCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return defined(this._geoJsonItem) ? this._geoJsonItem.dataSource : undefined;
        }
    }
});

ElevationCatalogItem.prototype._load = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
        this._geoJsonItem._disable();
        this._geoJsonItem = undefined;
    }

    if (!defined(this.elevationResult)) {
        return;
    }

    var distance = this.parameters[0].getLineDistance();
    var distanceVsElevationCsv = resultToDistanceVsElevationCsv(this.elevationResult, this.waterResult, distance);
    var chartOptions = ' title="' + this.chartName + '" column-units="Distance (m), Meters, Meters" ';

    var content = '<collapsible open="true">';
    content += '<chart data=\'' + distanceVsElevationCsv + '\' styling="histogram"' + chartOptions + '></chart>';
    content += '</collapsible>';

    this.shortReportSections.push(new ShortReportSection({
        content: content
    }));

    var inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
            '<tr>' +
                '<td style="vertical-align: middle">line</td>' +
                '<td style="padding-left: 4px">' + this.parameters[0].formatValueAsString() + '</td>' +
            '</tr>' +
            '<tr>' +
                '<td style="vertical-align: middle">distance</td>' +
                '<td style="padding-left: 4px">' + this.parameters[0].getLineDistance() + '</td>' +
            '</tr>' +
            '<tr>' +
                '<td style="vertical-align: middle">count</td>' +
                '<td style="padding-left: 4px">500</td>' +
            '</tr>' +
        '</table>';

    var outputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
            '<tr>' +
                '<td style="vertical-align: middle">Path Elevation</td>' +
                '<td><chart data=\'' + distanceVsElevationCsv + '\' styling: "feature-info"' + chartOptions + '></td>' +
            '</tr>' +
        '</table>';

    var section = this.findInfoSection('Inputs');
    if (!defined(section)) {
        this.info.push({
            name: 'Inputs',
            content: inputsSection
        });
    }

    if (!defined(this.featureInfoTemplate)) {
        this.featureInfoTemplate =
            '#### Inputs\n\n' +
            inputsSection + '\n\n' +
            '#### Outputs\n\n' +
            outputsSection;
    }

    var geojson = {
        "type":"FeatureCollection",
        "features": [this.parameters[0].getGeoJsonFeature()],
        "totalFeatures": 1
    };

    this._geoJsonItem = new GeoJsonCatalogItem(this.terria);
    this._geoJsonItem.name = this.name;
    this._geoJsonItem.data = geojson;
    var that = this;
    return this._geoJsonItem.load().then(function() {
        if (!defined(that.rectangle)) {
            that.rectangle = that._geoJsonItem.rectangle;
        }
    });
};

ElevationCatalogItem.prototype._enable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._enable();
    }
};

ElevationCatalogItem.prototype._disable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._disable();
    }
};

ElevationCatalogItem.prototype._show = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._show();
    }
};

ElevationCatalogItem.prototype._hide = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
    }
};

function resultToDistanceVsElevationCsv(elevationResult, waterResult, distance) {
    var distanceIncrement = distance/elevationResult.length;
    var currentDistance = distanceIncrement;
    var csv = 'Distance,Elevation';
    if (defined(waterResult)) {
        csv += ',Water Table';
    }
    csv += '\n';
    for (var i = 0; i < elevationResult.length; ++i) {
        csv += currentDistance + ',' + elevationResult[i].z;
        if (defined(waterResult) &&
            (Math.abs(elevationResult[i].x - waterResult[i].x) < 0.01) &&
            (Math.abs(elevationResult[i].y - waterResult[i].y) < 0.01)) {
            if (waterResult[i].z === 'null') {
                csv += ',';
            } else {
                csv += ',' + waterResult[i].z;
            }
        }
        csv += '\n';
        currentDistance += distanceIncrement;
    }
    return csv;
}

module.exports = ElevationCatalogItem;
